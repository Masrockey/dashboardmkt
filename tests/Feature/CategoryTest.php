<?php

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\User;

test('guests are redirected to the login page when visiting categories', function () {
    $response = $this->get(route('categories.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access categories', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('categories.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the categories page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('categories.index'));

    $response->assertOk();
});

test('authorized users can create a category', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    $response = $this->actingAs($user)->post(route('categories.store'), [
        'nama_kategori' => 'Pameran Mall',
    ]);

    $response->assertRedirect(route('categories.index'));

    $this->assertDatabaseHas('categories', [
        'nama_kategori' => 'Pameran Mall',
    ]);
});

test('nama kategori must be unique when creating', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Category::create(['nama_kategori' => 'Pameran Mall']);

    $response = $this->actingAs($user)->post(route('categories.store'), [
        'nama_kategori' => 'Pameran Mall',
    ]);

    $response->assertSessionHasErrors(['nama_kategori']);
});

test('authorized users can update a category', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $category = Category::create(['nama_kategori' => 'Pameran Mall']);

    $response = $this->actingAs($user)->put(route('categories.update', $category), [
        'nama_kategori' => 'Pameran Outdoor',
    ]);

    $response->assertRedirect(route('categories.index'));

    $this->assertDatabaseHas('categories', [
        'id' => $category->id,
        'nama_kategori' => 'Pameran Outdoor',
    ]);
});

test('authorized users can delete a category', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $category = Category::create(['nama_kategori' => 'Pameran Mall']);

    $response = $this->actingAs($user)->delete(route('categories.destroy', $category));

    $response->assertRedirect(route('categories.index'));

    $this->assertDatabaseMissing('categories', [
        'id' => $category->id,
    ]);
});
