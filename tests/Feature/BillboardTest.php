<?php

use App\Enums\BillboardLampStatus;
use App\Enums\BillboardPhysicalStatus;
use App\Models\Billboard;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests are redirected to the login page when visiting billboards', function () {
    $response = $this->get(route('billboards.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access billboards index', function () {
    $user = User::factory()->create([
        'roles' => ['dealer'],
        'role' => 'dealer',
    ]);

    $response = $this->actingAs($user)->get(route('billboards.index'));

    $response->assertForbidden();
});

test('superadmin can view the billboards page', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    Billboard::factory()->create([
        'lokasi' => 'Jl. Sriwijaya Mataram',
    ]);

    $response = $this->actingAs($superadmin)->get(route('billboards.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('billboards/index')
        ->has('billboards.data', 1)
        ->has('stats')
        ->has('lampStatuses')
        ->has('physicalStatuses')
    );
});

test('user with promosi.atl.billboard.read permission can view billboards', function () {
    $role = Role::create([
        'name' => 'atl_officer',
        'label' => 'ATL Officer',
        'permissions' => ['promosi.atl.billboard.read'],
        'is_system' => false,
    ]);

    $user = User::factory()->create([
        'roles' => ['atl_officer'],
        'role' => 'atl_officer',
    ]);

    $response = $this->actingAs($user)->get(route('billboards.index'));

    $response->assertOk();
});

test('authorized user can create billboard with evidence photos', function () {
    Storage::fake('public');

    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $fotoSiang = UploadedFile::fake()->image('siang.jpg');
    $fotoMalam = UploadedFile::fake()->image('malam.jpg');
    $fotoJauh = UploadedFile::fake()->image('jauh.jpg');
    $fotoDekat = UploadedFile::fake()->image('dekat.jpg');

    $response = $this->actingAs($superadmin)->post(route('billboards.store'), [
        'lokasi' => 'Simpang Lima Ampenan, Mataram',
        'latitude' => -8.574123,
        'longitude' => 116.085432,
        'ukuran' => '5 x 10 m',
        'tanggal_pasang' => '2026-10-01',
        'tanggal_berakhir' => '2027-10-01',
        'status_lampu' => BillboardLampStatus::Menyala->value,
        'status_fisik' => BillboardPhysicalStatus::Baik->value,
        'foto_siang' => $fotoSiang,
        'foto_malam' => $fotoMalam,
        'foto_jarak_jauh' => $fotoJauh,
        'foto_jarak_dekat' => $fotoDekat,
    ]);

    $response->assertRedirect(route('billboards.index'));

    $this->assertDatabaseHas('billboards', [
        'lokasi' => 'Simpang Lima Ampenan, Mataram',
        'ukuran' => '5 x 10 m',
        'status_lampu' => BillboardLampStatus::Menyala->value,
        'status_fisik' => BillboardPhysicalStatus::Baik->value,
    ]);

    $billboard = Billboard::where('lokasi', 'Simpang Lima Ampenan, Mataram')->first();
    expect($billboard)->not->toBeNull();
    expect($billboard->foto_siang)->not->toBeNull();
    expect($billboard->foto_malam)->not->toBeNull();
    expect($billboard->foto_jarak_jauh)->not->toBeNull();
    expect($billboard->foto_jarak_dekat)->not->toBeNull();

    Storage::disk('public')->assertExists($billboard->foto_siang);
    Storage::disk('public')->assertExists($billboard->foto_malam);
    Storage::disk('public')->assertExists($billboard->foto_jarak_jauh);
    Storage::disk('public')->assertExists($billboard->foto_jarak_dekat);
});

test('billboard creation validates required inputs', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $response = $this->actingAs($superadmin)->post(route('billboards.store'), [
        'lokasi' => '',
        'latitude' => 'invalid',
        'longitude' => '',
        'ukuran' => '',
        'tanggal_pasang' => 'not-a-date',
        'status_lampu' => 'invalid-status',
        'status_fisik' => 'invalid-physical',
    ]);

    $response->assertSessionHasErrors([
        'lokasi',
        'latitude',
        'longitude',
        'ukuran',
        'tanggal_pasang',
        'status_lampu',
        'status_fisik',
    ]);
});

test('authorized user can update billboard and replace evidence photos', function () {
    Storage::fake('public');

    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $oldPhoto = UploadedFile::fake()->image('old_siang.jpg')->store('billboards', 'public');

    $billboard = Billboard::factory()->create([
        'lokasi' => 'Lokasi Lama',
        'foto_siang' => $oldPhoto,
    ]);

    $newPhoto = UploadedFile::fake()->image('new_siang.jpg');

    $response = $this->actingAs($superadmin)->put(route('billboards.update', $billboard), [
        'lokasi' => 'Lokasi Diperbarui',
        'latitude' => -8.583300,
        'longitude' => 116.116700,
        'ukuran' => '4 x 8 m',
        'tanggal_pasang' => '2026-10-05',
        'tanggal_berakhir' => '2027-10-05',
        'status_lampu' => BillboardLampStatus::Mati->value,
        'status_fisik' => BillboardPhysicalStatus::RusakRingan->value,
        'foto_siang' => $newPhoto,
    ]);

    $response->assertRedirect(route('billboards.index'));

    $billboard->refresh();
    expect($billboard->lokasi)->toBe('Lokasi Diperbarui');
    expect($billboard->ukuran)->toBe('4 x 8 m');
    expect($billboard->status_lampu)->toBe(BillboardLampStatus::Mati);
    expect($billboard->status_fisik)->toBe(BillboardPhysicalStatus::RusakRingan);

    // Old photo should be removed and new photo should exist
    Storage::disk('public')->assertMissing($oldPhoto);
    Storage::disk('public')->assertExists($billboard->foto_siang);
});

test('authorized user can delete billboard and its photos are cleaned up', function () {
    Storage::fake('public');

    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $photoPath = UploadedFile::fake()->image('photo.jpg')->store('billboards', 'public');

    $billboard = Billboard::factory()->create([
        'foto_siang' => $photoPath,
    ]);

    Storage::disk('public')->assertExists($photoPath);

    $response = $this->actingAs($superadmin)->delete(route('billboards.destroy', $billboard));

    $response->assertRedirect(route('billboards.index'));
    $this->assertDatabaseMissing('billboards', ['id' => $billboard->id]);
    Storage::disk('public')->assertMissing($photoPath);
});

test('user without delete permission cannot delete billboard', function () {
    $role = Role::create([
        'name' => 'viewer_only',
        'label' => 'Viewer Only',
        'permissions' => ['promosi.atl.billboard.read', 'promosi.atl.billboard.write'],
        'is_system' => false,
    ]);

    $user = User::factory()->create([
        'roles' => ['viewer_only'],
        'role' => 'viewer_only',
    ]);

    $billboard = Billboard::factory()->create();

    $response = $this->actingAs($user)->delete(route('billboards.destroy', $billboard));

    $response->assertForbidden();
    $this->assertDatabaseHas('billboards', ['id' => $billboard->id]);
});
