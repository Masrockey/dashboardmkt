<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('unauthenticated users cannot access geocode endpoints', function () {
    $this->getJson(route('geocode.search', ['q' => 'epicentrum']))
        ->assertUnauthorized();

    $this->getJson(route('geocode.reverse', ['lat' => -8.58, 'lon' => 116.11]))
        ->assertUnauthorized();
});

test('authenticated users can search locations via geocode search', function () {
    Http::fake([
        'nominatim.openstreetmap.org/search*' => Http::response([
            [
                'place_id' => 12345,
                'name' => 'Lombok Epicentrum Mall',
                'display_name' => 'Lombok Epicentrum Mall, Mataram, NTB',
                'lat' => '-8.593496',
                'lon' => '116.104679',
                'address' => [
                    'shop' => 'Lombok Epicentrum Mall',
                    'county' => 'Kecamatan Mataram',
                    'city' => 'Kota Mataram',
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson(route('geocode.search', ['q' => 'epicentrum']));

    $response->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment([
            'name' => 'Lombok Epicentrum Mall',
            'latitude' => -8.593496,
            'longitude' => 116.104679,
            'kabupaten' => 'Kota Mataram',
            'kecamatan' => 'Mataram',
        ]);
});

test('authenticated users can reverse geocode coordinates', function () {
    Http::fake([
        'nominatim.openstreetmap.org/reverse*' => Http::response([
            'place_id' => 67890,
            'display_name' => 'Jalan Sriwijaya, Mataram',
            'lat' => '-8.593496',
            'lon' => '116.104679',
            'address' => [
                'road' => 'Jalan Sriwijaya',
                'county' => 'Kecamatan Mataram',
                'city' => 'Kota Mataram',
            ],
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson(route('geocode.reverse', ['lat' => -8.593496, 'lon' => 116.104679]));

    $response->assertOk()
        ->assertJsonFragment([
            'kabupaten' => 'Kota Mataram',
            'kecamatan' => 'Mataram',
            'latitude' => -8.593496,
            'longitude' => 116.104679,
        ]);
});

test('geocode search returns empty array for queries shorter than 2 chars', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->getJson(route('geocode.search', ['q' => 'a']));

    $response->assertOk()
        ->assertExactJson([]);
});
