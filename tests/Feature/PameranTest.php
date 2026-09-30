<?php

use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to the login page when visiting pameran', function () {
    $response = $this->get(route('pameran.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view the pameran page with mapPamerans for approval and edit maps', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);
    Pameran::factory()->create([
        'latitude' => -8.5833,
        'longitude' => 116.1167,
    ]);

    $response = $this->actingAs($user)->get(route('pameran.index'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('pameran/index')
        ->has('pamerans')
        ->has('mapPamerans')
    );
});

test('authenticated users can view the create pameran page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('pameran.create'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('pameran/create')
        ->has('dealers')
        ->has('jenisPameranList')
        ->has('existingPamerans')
    );
});

test('dealer can see all channel pins on create page but other dealers channels are masked with is_other_dealer flag', function () {
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

    $dealerUser = User::factory()->create([
        'role' => UserRole::Dealer,
        'dealer_id' => $dealerA->id,
    ]);

    $pameranA = Pameran::factory()->create([
        'dealer_id' => $dealerA->id,
        'latitude' => -8.5833,
        'longitude' => 116.1167,
    ]);

    $pameranB = Pameran::factory()->create([
        'dealer_id' => $dealerB->id,
        'latitude' => -8.6000,
        'longitude' => 116.1500,
    ]);

    $response = $this->actingAs($dealerUser)->get(route('pameran.create'));

    $response->assertOk();
    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('pameran/create')
        ->has('existingPamerans', 2)
        ->where('existingPamerans.0.id', $pameranB->id)
        ->where('existingPamerans.0.is_other_dealer', true)
        ->where('existingPamerans.1.id', $pameranA->id)
        ->where('existingPamerans.1.is_other_dealer', false)
    );
});

test('authenticated users can create a pameran with valid data and initial status is menunggu_spv', function () {
    $dealer = Dealer::factory()->create();
    $user = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
    $jenisPameran = JenisPameran::factory()->create(['kode_pameran' => 'EXH-A']);

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Cakranegara',
        'detail_alamat' => 'Depan Mall Epicentrum Lombok',
    ]);

    $response->assertRedirect(route('pameran.index'));

    $this->assertDatabaseHas('pamerans', [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Cakranegara',
        'detail_alamat' => 'Depan Mall Epicentrum Lombok',
        'kode_pameran_md' => null,
        'kode_pameran_ahm' => null,
        'status' => 'menunggu_spv',
        'created_by_user_id' => $user->id,
    ]);

    $pameran = Pameran::latest('id')->first();
    expect($pameran->kode_pameran_md)->toBeNull();
    expect($pameran->kode_pameran_ahm)->toBeNull();
    expect($pameran->status->value)->toBe('menunggu_spv');
});

test('admin can create pameran with kode_pameran_ahm', function () {
    $dealer = Dealer::factory()->create();
    $admin = User::factory()->create(['role' => UserRole::Superadmin]);
    $jenisPameran = JenisPameran::factory()->create(['kode_pameran' => 'EXH-A']);

    $response = $this->actingAs($admin)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Cakranegara',
        'detail_alamat' => 'Depan Mall Epicentrum Lombok',
        'kode_pameran_ahm' => 'AHM-2026-001',
    ]);

    $response->assertRedirect(route('pameran.index'));

    $this->assertDatabaseHas('pamerans', [
        'dealer_id' => $dealer->id,
        'kode_pameran_ahm' => 'AHM-2026-001',
    ]);
});

test('creating pameran fails if required fields are missing', function () {
    $dealer = Dealer::factory()->create();
    $user = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => '',
        'jenis_pameran_id' => '',
        'mulai_tanggal_sewa' => '',
        'tanggal_sewa_berakhir' => '',
        'kecamatan' => '',
        'detail_alamat' => '',
    ]);

    $response->assertSessionHasErrors([
        'dealer_id',
        'jenis_pameran_id',
        'mulai_tanggal_sewa',
        'tanggal_sewa_berakhir',
        'kecamatan',
        'detail_alamat',
    ]);
});

test('creating pameran fails if tanggal_sewa_berakhir is before mulai_tanggal_sewa', function () {
    $dealer = Dealer::factory()->create();
    $user = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
    $jenisPameran = JenisPameran::factory()->create();

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-10',
        'tanggal_sewa_berakhir' => '2026-10-01',
        'kecamatan' => 'Mataram',
        'detail_alamat' => 'Jl. Pejanggik',
    ]);

    $response->assertSessionHasErrors(['tanggal_sewa_berakhir']);
});

test('creating pameran fails if dealer or jenis pameran does not exist', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => 999999,
        'jenis_pameran_id' => 999999,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Mataram',
        'detail_alamat' => 'Jl. Pejanggik',
    ]);

    $response->assertSessionHasErrors(['dealer_id', 'jenis_pameran_id']);
});

test('authenticated users can update an existing pameran', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $pameran = Pameran::factory()->create(['kode_pameran_ahm' => 'OLD-AHM']);
    $originalMd = $pameran->kode_pameran_md;
    $newDealer = Dealer::factory()->create();
    $newJenis = JenisPameran::factory()->create();

    $response = $this->actingAs($user)->put(route('pameran.update', $pameran), [
        'dealer_id' => $newDealer->id,
        'jenis_pameran_id' => $newJenis->id,
        'mulai_tanggal_sewa' => '2026-11-01',
        'tanggal_sewa_berakhir' => '2026-11-15',
        'kecamatan' => 'Ampenan Baru',
        'detail_alamat' => 'Lokasi Diperbarui',
        'kode_pameran_ahm' => 'NEW-AHM-002',
    ]);

    $response->assertRedirect(route('pameran.index'));

    $this->assertDatabaseHas('pamerans', [
        'id' => $pameran->id,
        'dealer_id' => $newDealer->id,
        'jenis_pameran_id' => $newJenis->id,
        'mulai_tanggal_sewa' => '2026-11-01',
        'tanggal_sewa_berakhir' => '2026-11-15',
        'kecamatan' => 'Ampenan Baru',
        'detail_alamat' => 'Lokasi Diperbarui',
        'kode_pameran_md' => $originalMd,
        'kode_pameran_ahm' => 'NEW-AHM-002',
    ]);
});

test('pameran list can be filtered by kode_pameran_md or kode_pameran_ahm', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $pameran1 = Pameran::factory()->approved()->create(['kode_pameran_ahm' => 'AHM-MATCH-01']);
    $pameran2 = Pameran::factory()->approved()->create(['kode_pameran_ahm' => 'OTHER-02']);

    // Search by AHM code
    $this->actingAs($user)
        ->get(route('pameran.index', ['search' => 'AHM-MATCH']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('pameran/index')
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.kode_pameran_md', $pameran1->kode_pameran_md)
            ->where('pamerans.data.0.kode_pameran_ahm', 'AHM-MATCH-01')
        );

    // Search by MD code
    $this->actingAs($user)
        ->get(route('pameran.index', ['search' => $pameran2->kode_pameran_md]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('pameran/index')
            ->has('pamerans.data', 1)
            ->where('pamerans.data.0.kode_pameran_md', $pameran2->kode_pameran_md)
            ->where('pamerans.data.0.kode_pameran_ahm', 'OTHER-02')
        );
});

test('authenticated users can delete a pameran', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $pameran = Pameran::factory()->create();

    $response = $this->actingAs($user)->delete(route('pameran.destroy', $pameran));

    $response->assertRedirect(route('pameran.index'));

    $this->assertDatabaseMissing('pamerans', [
        'id' => $pameran->id,
    ]);
});

test('authenticated users can create a pameran with coordinates from map', function () {
    $dealer = Dealer::factory()->create();
    $user = User::factory()->create(['role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);
    $jenisPameran = JenisPameran::factory()->create();

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenisPameran->id,
        'mulai_tanggal_sewa' => '2026-10-01',
        'tanggal_sewa_berakhir' => '2026-10-10',
        'kecamatan' => 'Cakranegara',
        'detail_alamat' => 'Jl. Pejanggik No. 12',
        'latitude' => -8.5833807,
        'longitude' => 116.1167899,
    ]);

    $response->assertRedirect(route('pameran.index'));

    $this->assertDatabaseHas('pamerans', [
        'dealer_id' => $dealer->id,
        'kecamatan' => 'Cakranegara',
        'detail_alamat' => 'Jl. Pejanggik No. 12',
        'latitude' => -8.5833807,
        'longitude' => 116.1167899,
    ]);
});
