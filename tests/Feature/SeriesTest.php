<?php

use App\Enums\UserRole;
use App\Models\Series;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to the login page when visiting series', function () {
    $response = $this->get(route('series.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access series', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('series.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the series page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('series.index'));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('series/index')
            ->has('series')
            ->has('filters')
        );
});

test('authorized users can create a series with nama and deskripsi', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    $response = $this->actingAs($user)->post(route('series.store'), [
        'nama' => 'BeAT Series',
        'deskripsi' => 'Skutik populer untuk komuter harian',
    ]);

    $response->assertRedirect(route('series.index'));

    $this->assertDatabaseHas('series', [
        'nama' => 'BeAT Series',
        'deskripsi' => 'Skutik populer untuk komuter harian',
    ]);
});

test('nama series must be unique when creating', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Series::create(['nama' => 'Vario Series', 'deskripsi' => 'Skutik sporty']);

    $response = $this->actingAs($user)->post(route('series.store'), [
        'nama' => 'Vario Series',
        'deskripsi' => 'Deskripsi lain',
    ]);

    $response->assertSessionHasErrors(['nama']);
});

test('authorized users can update a series', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $series = Series::create(['nama' => 'PCX Series', 'deskripsi' => 'Skutik premium']);

    $response = $this->actingAs($user)->put(route('series.update', $series), [
        'nama' => 'PCX 160 Series',
        'deskripsi' => 'Skutik premium 160cc',
    ]);

    $response->assertRedirect(route('series.index'));

    $this->assertDatabaseHas('series', [
        'id' => $series->id,
        'nama' => 'PCX 160 Series',
        'deskripsi' => 'Skutik premium 160cc',
    ]);
});

test('authorized users can delete a series', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $series = Series::create(['nama' => 'ADV Series', 'deskripsi' => 'Adventure scooter']);

    $response = $this->actingAs($user)->delete(route('series.destroy', $series));

    $response->assertRedirect(route('series.index'));

    $this->assertDatabaseMissing('series', [
        'id' => $series->id,
    ]);
});

test('series can be filtered by search query', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Series::create(['nama' => 'CBR Series', 'deskripsi' => 'Motor sport fairing']);
    Series::create(['nama' => 'Scoopy Series', 'deskripsi' => 'Skutik retro']);

    $response = $this->actingAs($user)->get(route('series.index', ['search' => 'CBR']));

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('series/index')
            ->where('series.total', 1)
            ->where('series.data.0.nama', 'CBR Series')
        );
});
