<?php

use App\Enums\UserRole;
use App\Models\Kabupaten;
use App\Models\User;

test('guests are redirected to the login page when visiting kabupatens', function () {
    $response = $this->get(route('kabupatens.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access kabupatens', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('kabupatens.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the kabupatens page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('kabupatens.index'));

    $response->assertOk();
});

test('authorized users can create a kabupaten', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    $response = $this->actingAs($user)->post(route('kabupatens.store'), [
        'nama_kabupaten' => 'Lombok Barat',
    ]);

    $response->assertRedirect(route('kabupatens.index'));

    $this->assertDatabaseHas('kabupatens', [
        'nama_kabupaten' => 'Lombok Barat',
    ]);
});

test('nama kabupaten must be unique when creating', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Kabupaten::create(['nama_kabupaten' => 'Lombok Barat']);

    $response = $this->actingAs($user)->post(route('kabupatens.store'), [
        'nama_kabupaten' => 'Lombok Barat',
    ]);

    $response->assertSessionHasErrors(['nama_kabupaten']);
});

test('authorized users can update a kabupaten', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $kabupaten = Kabupaten::create(['nama_kabupaten' => 'Lombok Barat']);

    $response = $this->actingAs($user)->put(route('kabupatens.update', $kabupaten), [
        'nama_kabupaten' => 'Lombok Timur',
    ]);

    $response->assertRedirect(route('kabupatens.index'));

    $this->assertDatabaseHas('kabupatens', [
        'id' => $kabupaten->id,
        'nama_kabupaten' => 'Lombok Timur',
    ]);
});

test('authorized users can delete a kabupaten', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $kabupaten = Kabupaten::create(['nama_kabupaten' => 'Lombok Barat']);

    $response = $this->actingAs($user)->delete(route('kabupatens.destroy', $kabupaten));

    $response->assertRedirect(route('kabupatens.index'));

    $this->assertDatabaseMissing('kabupatens', [
        'id' => $kabupaten->id,
    ]);
});
