<?php

use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\Pameran;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('superadmin can access dashboard and see all pamerans with coordinates and stats', function () {
    $superadmin = User::factory()->create(['role' => UserRole::Superadmin]);
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

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

    $this->actingAs($superadmin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('mapPamerans', 2)
            ->has('stats')
            ->where('stats.total', 2)
            ->has('jenisPameranList')
        );
});

test('spv can access dashboard and see all pamerans on map', function () {
    $spv = User::factory()->create(['role' => UserRole::Spv]);
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

    Pameran::factory()->create([
        'dealer_id' => $dealerA->id,
        'latitude' => -8.5833,
        'longitude' => 116.1167,
    ]);

    Pameran::factory()->create([
        'dealer_id' => $dealerB->id,
        'latitude' => -8.6000,
        'longitude' => 116.1500,
    ]);

    $this->actingAs($spv)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('mapPamerans', 2)
            ->where('stats.total', 2)
        );
});

test('kabag can access dashboard and see all pamerans on map', function () {
    $kabag = User::factory()->create(['role' => UserRole::Kabag]);
    $dealerA = Dealer::factory()->create();
    $dealerB = Dealer::factory()->create();

    Pameran::factory()->create([
        'dealer_id' => $dealerA->id,
        'latitude' => -8.5833,
        'longitude' => 116.1167,
    ]);

    Pameran::factory()->create([
        'dealer_id' => $dealerB->id,
        'latitude' => -8.6000,
        'longitude' => 116.1500,
    ]);

    $this->actingAs($kabag)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('mapPamerans', 2)
            ->where('stats.total', 2)
        );
});

test('dealer only sees their own dealer pamerans on dashboard map and stats', function () {
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

    $this->actingAs($dealerUser)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('mapPamerans', 1)
            ->where('mapPamerans.0.id', $pameranA->id)
            ->where('stats.total', 1)
        );
});

test('pamerans without coordinates are not included in mapPamerans', function () {
    $superadmin = User::factory()->create(['role' => UserRole::Superadmin]);

    // Pameran with coordinates
    $pameranWithCoords = Pameran::factory()->create([
        'latitude' => -8.5833,
        'longitude' => 116.1167,
    ]);

    // Pameran without coordinates
    Pameran::factory()->create([
        'latitude' => null,
        'longitude' => null,
    ]);

    $this->actingAs($superadmin)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('dashboard')
            ->has('mapPamerans', 1)
            ->where('mapPamerans.0.id', $pameranWithCoords->id)
            ->where('stats.total', 2) // Stats count all pameran
        );
});
