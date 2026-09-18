<?php

use App\Models\Dealer;
use App\Models\User;

test('guests are redirected to the login page when visiting dealers', function () {
    $response = $this->get(route('dealers.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view the dealers page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('dealers.index'));

    $response->assertOk();
});

test('authenticated users can create a dealer with valid data', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('dealers.store'), [
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer Maju Sentosa',
    ]);

    $response->assertRedirect(route('dealers.index'));
    $this->assertDatabaseHas('dealers', [
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer Maju Sentosa',
    ]);
});

test('creating a dealer fails if kode_dealer is already taken', function () {
    $user = User::factory()->create();
    Dealer::factory()->create(['kode_dealer' => 'DLR001']);

    $response = $this->actingAs($user)->post(route('dealers.store'), [
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer Lainnya',
    ]);

    $response->assertSessionHasErrors(['kode_dealer']);
});

test('creating a dealer fails if required fields are missing', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('dealers.store'), [
        'kode_dealer' => '',
        'nama_dealer' => '',
    ]);

    $response->assertSessionHasErrors(['kode_dealer', 'nama_dealer']);
});

test('authenticated users can update an existing dealer', function () {
    $user = User::factory()->create();
    $dealer = Dealer::factory()->create([
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer Lama',
    ]);

    $response = $this->actingAs($user)->put(route('dealers.update', $dealer), [
        'kode_dealer' => 'DLR001-UPDATED',
        'nama_dealer' => 'Dealer Baru Diperbarui',
    ]);

    $response->assertRedirect(route('dealers.index'));
    $this->assertDatabaseHas('dealers', [
        'id' => $dealer->id,
        'kode_dealer' => 'DLR001-UPDATED',
        'nama_dealer' => 'Dealer Baru Diperbarui',
    ]);
});

test('updating a dealer preserves the same kode_dealer for the same record', function () {
    $user = User::factory()->create();
    $dealer = Dealer::factory()->create([
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer A',
    ]);

    $response = $this->actingAs($user)->put(route('dealers.update', $dealer), [
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer A Updated',
    ]);

    $response->assertRedirect(route('dealers.index'));
    $this->assertDatabaseHas('dealers', [
        'id' => $dealer->id,
        'kode_dealer' => 'DLR001',
        'nama_dealer' => 'Dealer A Updated',
    ]);
});

test('authenticated users can delete a dealer', function () {
    $user = User::factory()->create();
    $dealer = Dealer::factory()->create();

    $response = $this->actingAs($user)->delete(route('dealers.destroy', $dealer));

    $response->assertRedirect(route('dealers.index'));
    $this->assertDatabaseMissing('dealers', [
        'id' => $dealer->id,
    ]);
});
