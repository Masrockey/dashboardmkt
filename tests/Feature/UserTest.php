<?php

use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('guests are redirected to the login page when visiting users', function () {
    $response = $this->get(route('users.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view the users page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('users.index'));

    $response->assertOk();
});

test('authenticated users can create a user with role and dealer', function () {
    $authUser = User::factory()->create();
    $dealer = Dealer::factory()->create();

    $response = $this->actingAs($authUser)->post(route('users.store'), [
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'password' => 'secret123',
        'role' => UserRole::Dealer->value,
        'dealer_id' => $dealer->id,
    ]);

    $response->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john.doe@example.com',
        'role' => 'dealer',
        'dealer_id' => $dealer->id,
    ]);

    $createdUser = User::where('email', 'john.doe@example.com')->first();
    expect(Hash::check('secret123', $createdUser->password))->toBeTrue();
});

test('creating a user can be done for superadmin without a dealer', function () {
    $authUser = User::factory()->create();

    $response = $this->actingAs($authUser)->post(route('users.store'), [
        'name' => 'Super Admin User',
        'email' => 'superadmin@example.com',
        'password' => 'secret123',
        'role' => UserRole::Superadmin->value,
        'dealer_id' => null,
    ]);

    $response->assertRedirect(route('users.index'));

    $this->assertDatabaseHas('users', [
        'name' => 'Super Admin User',
        'email' => 'superadmin@example.com',
        'role' => 'superadmin',
        'dealer_id' => null,
    ]);
});

test('creating a user fails if email is already taken', function () {
    $authUser = User::factory()->create();
    User::factory()->create(['email' => 'existing@example.com']);

    $response = $this->actingAs($authUser)->post(route('users.store'), [
        'name' => 'New User',
        'email' => 'existing@example.com',
        'password' => 'secret123',
        'role' => UserRole::Spv->value,
    ]);

    $response->assertSessionHasErrors(['email']);
});

test('creating a user fails with invalid role', function () {
    $authUser = User::factory()->create();

    $response = $this->actingAs($authUser)->post(route('users.store'), [
        'name' => 'Invalid Role User',
        'email' => 'invalid@example.com',
        'password' => 'secret123',
        'role' => 'invalid-role',
    ]);

    $response->assertSessionHasErrors(['role']);
});

test('authenticated users can update a user without changing password', function () {
    $authUser = User::factory()->create();
    $dealer = Dealer::factory()->create();
    $targetUser = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'password' => Hash::make('original-password'),
        'role' => UserRole::Dealer,
    ]);

    $response = $this->actingAs($authUser)->put(route('users.update', $targetUser), [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
        'password' => '',
        'role' => UserRole::Kabag->value,
        'dealer_id' => $dealer->id,
    ]);

    $response->assertRedirect(route('users.index'));

    $targetUser->refresh();
    expect($targetUser->name)->toBe('Updated Name')
        ->and($targetUser->email)->toBe('updated@example.com')
        ->and($targetUser->role)->toBe(UserRole::Kabag)
        ->and($targetUser->dealer_id)->toBe($dealer->id);

    expect(Hash::check('original-password', $targetUser->password))->toBeTrue();
});

test('authenticated users can update a user with a new password', function () {
    $authUser = User::factory()->create();
    $targetUser = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);

    $response = $this->actingAs($authUser)->put(route('users.update', $targetUser), [
        'name' => $targetUser->name,
        'email' => $targetUser->email,
        'password' => 'new-secret-password',
        'role' => $targetUser->role->value,
        'dealer_id' => $targetUser->dealer_id,
    ]);

    $response->assertRedirect(route('users.index'));

    $targetUser->refresh();
    expect(Hash::check('new-secret-password', $targetUser->password))->toBeTrue();
});

test('authenticated users can delete another user', function () {
    $authUser = User::factory()->create();
    $targetUser = User::factory()->create();

    $response = $this->actingAs($authUser)->delete(route('users.destroy', $targetUser));

    $response->assertRedirect(route('users.index'));
    $this->assertDatabaseMissing('users', [
        'id' => $targetUser->id,
    ]);
});

test('authenticated users cannot delete their own account via user management', function () {
    $authUser = User::factory()->create();

    $response = $this->actingAs($authUser)->delete(route('users.destroy', $authUser));

    $response->assertForbidden();
    $this->assertDatabaseHas('users', [
        'id' => $authUser->id,
    ]);
});
