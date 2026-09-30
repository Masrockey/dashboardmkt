<?php

use App\Enums\UserRole;
use App\Models\JenisPameran;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests are redirected to the login page when visiting jenis pameran', function () {
    $response = $this->get(route('jenis-pameran.index'));

    $response->assertRedirect(route('login'));
});

test('dealer or kabag users cannot access jenis pameran', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('jenis-pameran.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the jenis pameran page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('jenis-pameran.index'));

    $response->assertOk();
});

test('authenticated superadmin users can create a jenis pameran without icon map', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->post(route('jenis-pameran.store'), [
        'kode_pameran' => 'PMR01',
        'jenis_pameran' => 'Pameran Mall',
        'icon_map' => null,
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $this->assertDatabaseHas('jenis_pamerans', [
        'kode_pameran' => 'PMR01',
        'jenis_pameran' => 'Pameran Mall',
        'icon_map' => null,
    ]);
});

test('authenticated superadmin users can create a jenis pameran with uploaded icon map', function () {
    Storage::fake('public');
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $file = UploadedFile::fake()->image('marker.png');

    $response = $this->actingAs($user)->post(route('jenis-pameran.store'), [
        'kode_pameran' => 'PMR02',
        'jenis_pameran' => 'Pameran Outdoor',
        'icon_map' => $file,
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $created = JenisPameran::where('kode_pameran', 'PMR02')->first();
    expect($created)->not->toBeNull();
    expect($created->icon_map)->not->toBeNull();
    Storage::disk('public')->assertExists($created->icon_map);
});
