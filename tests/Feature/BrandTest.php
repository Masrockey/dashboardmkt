<?php

use App\Enums\UserRole;
use App\Models\Brand;
use App\Models\Category;
use App\Models\User;

test('guests are redirected to the login page when visiting brands', function () {
    $response = $this->get(route('brands.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access brands', function () {
    $user = User::factory()->create(['role' => UserRole::Kabag]);

    $response = $this->actingAs($user)->get(route('brands.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the brands page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('brands.index'));

    $response->assertOk();
});

test('authorized users can create a brand with category', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);
    $category = Category::create(['nama_kategori' => 'Automatic']);

    $response = $this->actingAs($user)->post(route('brands.store'), [
        'nama_brand' => 'Vario 160',
        'category_id' => $category->id,
    ]);

    $response->assertRedirect(route('brands.index'));

    $this->assertDatabaseHas('brands', [
        'nama_brand' => 'Vario 160',
        'category_id' => $category->id,
    ]);
});

test('nama brand must be unique when creating', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Brand::create(['nama_brand' => 'Vario 160']);

    $response = $this->actingAs($user)->post(route('brands.store'), [
        'nama_brand' => 'Vario 160',
    ]);

    $response->assertSessionHasErrors(['nama_brand']);
});

test('authorized users can update a brand and category', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $category1 = Category::create(['nama_kategori' => 'Automatic']);
    $category2 = Category::create(['nama_kategori' => 'Sport']);
    $brand = Brand::create(['nama_brand' => 'Vario 160', 'category_id' => $category1->id]);

    $response = $this->actingAs($user)->put(route('brands.update', $brand), [
        'nama_brand' => 'CBR 150R',
        'category_id' => $category2->id,
    ]);

    $response->assertRedirect(route('brands.index'));

    $this->assertDatabaseHas('brands', [
        'id' => $brand->id,
        'nama_brand' => 'CBR 150R',
        'category_id' => $category2->id,
    ]);
});

test('authorized users can delete a brand', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $brand = Brand::create(['nama_brand' => 'Vario 160']);

    $response = $this->actingAs($user)->delete(route('brands.destroy', $brand));

    $response->assertRedirect(route('brands.index'));

    $this->assertDatabaseMissing('brands', [
        'id' => $brand->id,
    ]);
});
