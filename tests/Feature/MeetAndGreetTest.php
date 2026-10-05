<?php

use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\MeetAndGreet;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated users can view meet and greet page and see fixed dealer asal options', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('meet-and-greet.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('meet-and-greet/index')
        ->has('dealers')
        ->where('dealers', fn ($dealers) => collect($dealers)->contains('Krida Mataram')
            && collect($dealers)->contains('FIF Mataram')
            && collect($dealers)->count() === 12
        )
    );
});

test('authenticated users can create a meet and greet record with valid data', function () {
    Storage::fake('public');

    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->post(route('meet-and-greet.store'), [
        'dealer_asal' => 'FIF Mataram',
        'nama_konsumen' => 'Budi Santoso',
        'alamat' => 'Jl. Pejanggik No. 12, Mataram',
        'no_hp' => '081234567890',
        'tipe_motor' => 'PCX 160',
        'no_plat' => 'DR 1234 AB',
        'stnk' => UploadedFile::fake()->image('stnk.jpg'),
    ]);

    $response->assertRedirect(route('meet-and-greet.index'));
    $this->assertDatabaseHas('meet_and_greets', [
        'dealer_asal' => 'FIF Mataram',
        'nama_konsumen' => 'Budi Santoso',
        'no_plat' => 'DR 1234 AB',
    ]);
});

test('guests can access public meet and greet form at /meetngreethonda and see fixed dealer asal options', function () {
    $response = $this->get(route('meetngreethonda.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('meet-and-greet/public')
        ->has('dealers')
        ->has('motorcycleTypes')
        ->where('dealers', fn ($dealers) => collect($dealers)->contains('Krida Mataram')
            && collect($dealers)->contains('FIF Mataram')
            && collect($dealers)->contains('Daya Selaparang')
            && collect($dealers)->count() === 12
        )
    );
});

test('guests can submit meet and greet registration form via public route', function () {
    Storage::fake('public');

    $response = $this->post(route('meetngreethonda.store'), [
        'dealer_asal' => 'FIF Mataram',
        'nama_konsumen' => 'Siti Rahma',
        'alamat' => 'Jl. Airlangga No. 45, Mataram',
        'no_hp' => '087812345678',
        'tipe_motor' => 'Vario 160',
        'no_plat' => 'DR 5678 XY',
        'stnk' => UploadedFile::fake()->image('stnk_siti.jpg'),
    ]);

    $saved = MeetAndGreet::where('nama_konsumen', 'Siti Rahma')->first();
    expect($saved)->not->toBeNull()
        ->and($saved->no_registrasi)->toStartWith('MNG-'.now()->format('Ymd').'-')
        ->and($saved->dealer_asal)->toBe('FIF Mataram');

    $response->assertRedirect(route('meetngreethonda.index', ['registered' => $saved->no_registrasi]));
    $response->assertSessionHas('success');
    $response->assertSessionHas('no_registrasi');

    $this->assertDatabaseHas('meet_and_greets', [
        'dealer_asal' => 'FIF Mataram',
        'nama_konsumen' => 'Siti Rahma',
        'tipe_motor' => 'Vario 160',
        'no_plat' => 'DR 5678 XY',
        'created_by_user_id' => null,
    ]);
});

test('guests can view public registration success page with registered parameter', function () {
    $item = MeetAndGreet::factory()->create();

    $response = $this->get(route('meetngreethonda.index', ['registered' => $item->no_registrasi]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('meet-and-greet/public')
        ->where('registeredNo', $item->no_registrasi)
        ->where('registrationSuccess.no_registrasi', $item->no_registrasi)
        ->where('registrationSuccess.nama_konsumen', $item->nama_konsumen)
    );
});

test('no_registrasi is automatically generated and increments sequentially', function () {
    $dealer = Dealer::factory()->create();

    $item1 = MeetAndGreet::create([
        'dealer_id' => $dealer->id,
        'nama_konsumen' => 'Konsumen Satu',
        'alamat' => 'Alamat Satu',
        'no_hp' => '08111111111',
        'tipe_motor' => 'PCX 160',
        'no_plat' => 'DR 1111 AA',
    ]);

    $item2 = MeetAndGreet::create([
        'dealer_id' => $dealer->id,
        'nama_konsumen' => 'Konsumen Dua',
        'alamat' => 'Alamat Dua',
        'no_hp' => '08222222222',
        'tipe_motor' => 'ADV 160',
        'no_plat' => 'DR 2222 BB',
    ]);

    $prefix = 'MNG-'.now()->format('Ymd').'-';
    expect($item1->no_registrasi)->toBe($prefix.'0001')
        ->and($item2->no_registrasi)->toBe($prefix.'0002');
});

test('users can search meet and greet records by no_registrasi', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $dealer = Dealer::factory()->create();

    $target = MeetAndGreet::create([
        'dealer_id' => $dealer->id,
        'nama_konsumen' => 'Target Konsumen',
        'alamat' => 'Alamat Target',
        'no_hp' => '08333333333',
        'tipe_motor' => 'Beat',
        'no_plat' => 'DR 3333 CC',
    ]);

    MeetAndGreet::create([
        'dealer_id' => $dealer->id,
        'nama_konsumen' => 'Other Konsumen',
        'alamat' => 'Alamat Other',
        'no_hp' => '08444444444',
        'tipe_motor' => 'Scoopy',
        'no_plat' => 'DR 4444 DD',
    ]);

    $response = $this->actingAs($user)->get(route('meet-and-greet.index', ['search' => $target->no_registrasi]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('meet-and-greet/index')
        ->where('meetAndGreets.data.0.no_registrasi', $target->no_registrasi)
        ->has('meetAndGreets.data', 1)
    );
});
