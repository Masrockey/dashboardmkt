<?php

use App\Enums\PameranStatus;
use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('dealer creates pameran, then SPV approves and kode_pameran_md is generated', function () {
    $dealer = Dealer::factory()->create(['nama_dealer' => 'Astra Motor Mataram']);
    $jenisPameran = JenisPameran::factory()->create(['kode_pameran' => 'MALL']);

    $dealerUser = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealer->id,
    ]);
    $spvUser = User::factory()->create(['role' => UserRole::Spv]);

    // Step 1: Dealer creates pameran
    $response = $this->actingAs($dealerUser)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Mataram',
        'detail_alamat' => 'Lombok Epicentrum Mall',
    ]);

    $response->assertRedirect(route('pameran.index'));

    $pameran = Pameran::latest('id')->first();
    expect($pameran->status)->toBe(PameranStatus::MenungguSpv);
    expect($pameran->kode_pameran_md)->toBeNull();
    expect($pameran->created_by_user_id)->toBe($dealerUser->id);

    // Step 2: SPV approves pameran -> Kode Pameran MD is immediately generated!
    $responseSpv = $this->actingAs($spvUser)->post(route('pameran.approve-spv', $pameran));
    $responseSpv->assertRedirect();

    $pameran->refresh();
    $expectedKodeMd = 'MALL-'.now()->format('Ymd').'-0001';
    expect($pameran->status)->toBe(PameranStatus::Disetujui);
    expect($pameran->spv_approved_by)->toBe($spvUser->id);
    expect($pameran->spv_approved_at)->not->toBeNull();
    expect($pameran->kode_pameran_md)->toBe($expectedKodeMd);

    // Step 3: Create a second pameran and approve through SPV, sequence should be 0002
    $secondPameran = Pameran::factory()->create([
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'status' => PameranStatus::MenungguSpv,
    ]);

    $this->actingAs($spvUser)->post(route('pameran.approve-spv', $secondPameran));
    $secondPameran->refresh();
    $expectedSecondKodeMd = 'MALL-'.now()->format('Ymd').'-0002';
    expect($secondPameran->status)->toBe(PameranStatus::Disetujui);
    expect($secondPameran->kode_pameran_md)->toBe($expectedSecondKodeMd);
});

test('dealer or kabag cannot approve SPV stage', function () {
    $dealerUser = User::factory()->create(['role' => UserRole::Dealer]);
    $kabagUser = User::factory()->create(['role' => UserRole::Kabag]);
    $pameranSpv = Pameran::factory()->create(['status' => PameranStatus::MenungguSpv]);

    $this->actingAs($dealerUser)
        ->post(route('pameran.approve-spv', $pameranSpv))
        ->assertForbidden();

    $this->actingAs($kabagUser)
        ->post(route('pameran.approve-spv', $pameranSpv))
        ->assertForbidden();
});

test('superadmin can approve SPV stage', function () {
    $superadmin = User::factory()->create(['role' => UserRole::Superadmin]);
    $pameran = Pameran::factory()->create(['status' => PameranStatus::MenungguSpv]);

    $this->actingAs($superadmin)
        ->post(route('pameran.approve-spv', $pameran))
        ->assertRedirect();

    $pameran->refresh();
    expect($pameran->status)->toBe(PameranStatus::Disetujui);
    expect($pameran->kode_pameran_md)->not->toBeNull();
});

test('SPV or Superadmin can reject pameran with note', function () {
    $spvUser = User::factory()->create(['role' => UserRole::Spv]);
    $pameran = Pameran::factory()->create(['status' => PameranStatus::MenungguSpv]);

    $response = $this->actingAs($spvUser)->post(route('pameran.reject', $pameran), [
        'catatan_penolakan' => 'Lokasi sewa tidak disetujui karena jadwal bentrok.',
    ]);

    $response->assertRedirect();

    $pameran->refresh();
    expect($pameran->status)->toBe(PameranStatus::Ditolak);
    expect($pameran->catatan_penolakan)->toBe('Lokasi sewa tidak disetujui karena jadwal bentrok.');
});

test('dealer only sees pameran associated with their dealer', function () {
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

    $dealerUserA = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealerA->id,
    ]);

    $pameranA = Pameran::factory()->create(['dealer_id' => $dealerA->id]);
    $pameranB = Pameran::factory()->create(['dealer_id' => $dealerB->id]);

    $this->actingAs($dealerUserA)
        ->get(route('pameran.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('pameran/index')
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.id', $pameranA->id)
            ->has('dealers', 1)
            ->where('dealers.0.id', $dealerA->id)
        );
});

test('users of the same dealer can view the same dealer pameran', function () {
    $dealer = Dealer::factory()->create();

    $user1 = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealer->id,
    ]);

    $user2 = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealer->id,
    ]);

    $pameran = Pameran::factory()->create(['dealer_id' => $dealer->id]);

    // Both users can view the pameran
    $this->actingAs($user1)
        ->get(route('pameran.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.id', $pameran->id)
        );

    $this->actingAs($user2)
        ->get(route('pameran.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.id', $pameran->id)
        );
});

test('dealer cannot update or delete pameran belonging to another dealer', function () {
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

    $userA = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealerA->id,
    ]);

    $pameranB = Pameran::factory()->create(['dealer_id' => $dealerB->id]);

    // User A cannot update Pameran B
    $this->actingAs($userA)
        ->put(route('pameran.update', $pameranB), [
            'dealer_id' => $dealerA->id,
            'jenis_pameran_id' => $pameranB->jenis_pameran_id,
            'mulai_tanggal_sewa' => '2026-10-01',
            'tanggal_sewa_berakhir' => '2026-10-10',
            'kecamatan' => 'Hacked',
            'detail_alamat' => 'Hacked Address',
        ])
        ->assertForbidden();

    // User A cannot delete Pameran B
    $this->actingAs($userA)
        ->delete(route('pameran.destroy', $pameranB))
        ->assertForbidden();
});

test('dealer user without dealer_id cannot create pameran and sees no pameran', function () {
    $userWithoutDealer = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => null,
    ]);

    $dealer = Dealer::factory()->create();
    $jenis = JenisPameran::factory()->create();
    Pameran::factory()->create(['dealer_id' => $dealer->id]);

    // Cannot create
    $this->actingAs($userWithoutDealer)
        ->post(route('pameran.store'), [
            'dealer_id' => $dealer->id,
            'jenis_pameran_id' => $jenis->id,
            'mulai_tanggal_sewa' => '2026-10-01',
            'tanggal_sewa_berakhir' => '2026-10-10',
            'kecamatan' => 'Test',
            'detail_alamat' => 'Test Address',
        ])
        ->assertForbidden();

    // Cannot see any pameran
    $this->actingAs($userWithoutDealer)
        ->get(route('pameran.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pamerans.data', 0)
            ->has('dealers', 0)
        );
});

test('kabag can view pamerans on index page', function () {
    $kabagUser = User::factory()->create(['role' => UserRole::Kabag]);

    $pameranWaitingSpv = Pameran::factory()->create([
        'status' => PameranStatus::MenungguSpv,
    ]);

    $this->actingAs($kabagUser)
        ->get(route('pameran.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('pameran/index')
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.id', $pameranWaitingSpv->id)
        );
});

test('kabag cannot reject pameran', function () {
    $kabagUser = User::factory()->create(['role' => UserRole::Kabag]);
    $pameranWaitingSpv = Pameran::factory()->create([
        'status' => PameranStatus::MenungguSpv,
    ]);

    $this->actingAs($kabagUser)
        ->post(route('pameran.reject', $pameranWaitingSpv), [
            'catatan_penolakan' => 'Kabag mencoba menolak',
        ])
        ->assertForbidden();
});
