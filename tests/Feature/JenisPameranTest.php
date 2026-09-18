<?php

use App\Models\JenisPameran;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guests are redirected to the login page when visiting jenis pameran', function () {
    $response = $this->get(route('jenis-pameran.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view the jenis pameran page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('jenis-pameran.index'));

    $response->assertOk();
});

test('authenticated users can create a jenis pameran without icon map', function () {
    $user = User::factory()->create();

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

test('authenticated users can create a jenis pameran with uploaded icon map', function () {
    Storage::fake('public');
    $user = User::factory()->create();
    $file = UploadedFile::fake()->image('marker.png');

    $response = $this->actingAs($user)->post(route('jenis-pameran.store'), [
        'kode_pameran' => 'PMR02',
        'jenis_pameran' => 'Pameran Outdoor',
        'icon_map' => $file,
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $pameran = JenisPameran::where('kode_pameran', 'PMR02')->first();
    expect($pameran)->not->toBeNull()
        ->and($pameran->icon_map)->not->toBeNull();

    Storage::disk('public')->assertExists($pameran->icon_map);
});

test('creating jenis pameran fails if kode_pameran is duplicate', function () {
    $user = User::factory()->create();
    JenisPameran::factory()->create(['kode_pameran' => 'PMR01']);

    $response = $this->actingAs($user)->post(route('jenis-pameran.store'), [
        'kode_pameran' => 'PMR01',
        'jenis_pameran' => 'Pameran Lainnya',
    ]);

    $response->assertSessionHasErrors(['kode_pameran']);
});

test('creating jenis pameran fails if required fields are missing', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('jenis-pameran.store'), [
        'kode_pameran' => '',
        'jenis_pameran' => '',
    ]);

    $response->assertSessionHasErrors(['kode_pameran', 'jenis_pameran']);
});

test('authenticated users can update a jenis pameran', function () {
    $user = User::factory()->create();
    $pameran = JenisPameran::factory()->create([
        'kode_pameran' => 'PMR01',
        'jenis_pameran' => 'Nama Awal',
    ]);

    $response = $this->actingAs($user)->put(route('jenis-pameran.update', $pameran), [
        'kode_pameran' => 'PMR01-EDIT',
        'jenis_pameran' => 'Nama Diperbarui',
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $this->assertDatabaseHas('jenis_pamerans', [
        'id' => $pameran->id,
        'kode_pameran' => 'PMR01-EDIT',
        'jenis_pameran' => 'Nama Diperbarui',
    ]);
});

test('updating a jenis pameran can upload a new icon map and delete old one', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $oldFile = UploadedFile::fake()->image('old_marker.png');
    $oldPath = $oldFile->store('icons/pameran', 'public');

    $pameran = JenisPameran::factory()->create([
        'icon_map' => $oldPath,
    ]);

    $newFile = UploadedFile::fake()->image('new_marker.png');

    $response = $this->actingAs($user)->put(route('jenis-pameran.update', $pameran), [
        'kode_pameran' => $pameran->kode_pameran,
        'jenis_pameran' => $pameran->jenis_pameran,
        'icon_map' => $newFile,
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $pameran->refresh();
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($pameran->icon_map);
});

test('updating a jenis pameran can remove existing icon map', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $oldFile = UploadedFile::fake()->image('old_marker.png');
    $oldPath = $oldFile->store('icons/pameran', 'public');

    $pameran = JenisPameran::factory()->create([
        'icon_map' => $oldPath,
    ]);

    $response = $this->actingAs($user)->put(route('jenis-pameran.update', $pameran), [
        'kode_pameran' => $pameran->kode_pameran,
        'jenis_pameran' => $pameran->jenis_pameran,
        'remove_icon_map' => true,
    ]);

    $response->assertRedirect(route('jenis-pameran.index'));

    $pameran->refresh();
    expect($pameran->icon_map)->toBeNull();
    Storage::disk('public')->assertMissing($oldPath);
});

test('authenticated users can delete a jenis pameran and its icon file', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $file = UploadedFile::fake()->image('marker.png');
    $path = $file->store('icons/pameran', 'public');

    $pameran = JenisPameran::factory()->create([
        'icon_map' => $path,
    ]);

    $response = $this->actingAs($user)->delete(route('jenis-pameran.destroy', $pameran));

    $response->assertRedirect(route('jenis-pameran.index'));

    $this->assertDatabaseMissing('jenis_pamerans', [
        'id' => $pameran->id,
    ]);

    Storage::disk('public')->assertMissing($path);
});
