<?php

use App\Models\Role;
use App\Models\User;

test('guests are redirected to the login page when visiting roles', function () {
    $response = $this->get(route('roles.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access roles index', function () {
    $user = User::factory()->create([
        'roles' => ['dealer'],
        'role' => 'dealer',
    ]);

    $response = $this->actingAs($user)->get(route('roles.index'));

    $response->assertForbidden();
});

test('superadmin can view the roles page', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $response = $this->actingAs($superadmin)->get(route('roles.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('roles/index')
        ->has('roles')
        ->has('groupedPermissions')
    );
});

test('user with management.roles permission can view roles page', function () {
    $customRole = Role::create([
        'name' => 'role_manager',
        'label' => 'Role Manager',
        'description' => 'Can manage roles',
        'permissions' => ['management.roles'],
        'is_system' => false,
    ]);

    $user = User::factory()->create([
        'roles' => ['role_manager'],
        'role' => 'role_manager',
    ]);

    $response = $this->actingAs($user)->get(route('roles.index'));

    $response->assertOk();
});

test('superadmin can create a new custom role with permissions', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $response = $this->actingAs($superadmin)->post(route('roles.store'), [
        'name' => 'marketing_staff',
        'label' => 'Marketing Staff',
        'description' => 'Staff pemasaran pameran dan R2',
        'permissions' => ['pcd.dashboard', 'marketing.dashboard', 'marketing.r2'],
    ]);

    $response->assertRedirect(route('roles.index'));

    $this->assertDatabaseHas('roles', [
        'name' => 'marketing_staff',
        'label' => 'Marketing Staff',
        'is_system' => false,
    ]);

    $createdRole = Role::where('name', 'marketing_staff')->first();
    expect($createdRole->permissions)->toEqualCanonicalizing(['pcd.dashboard', 'marketing.dashboard', 'marketing.r2']);
});

test('role creation validates required and unique name', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $response = $this->actingAs($superadmin)->post(route('roles.store'), [
        'name' => 'superadmin', // already exists
        'label' => '',
    ]);

    $response->assertSessionHasErrors(['name', 'label']);
});

test('superadmin can update role and permissions', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $role = Role::create([
        'name' => 'event_coordinator',
        'label' => 'Event Coordinator',
        'description' => 'Initial description',
        'permissions' => ['pcd.meet_and_greet'],
        'is_system' => false,
    ]);

    $response = $this->actingAs($superadmin)->put(route('roles.update', $role), [
        'label' => 'Lead Event Coordinator',
        'description' => 'Updated description',
        'permissions' => ['pcd.meet_and_greet', 'pcd.channel'],
    ]);

    $response->assertRedirect(route('roles.index'));

    $role->refresh();
    expect($role->label)->toBe('Lead Event Coordinator');
    expect($role->description)->toBe('Updated description');
    expect($role->permissions)->toEqualCanonicalizing(['pcd.meet_and_greet', 'pcd.channel']);
});

test('system roles cannot be deleted', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $systemRole = Role::where('name', 'superadmin')->firstOrFail();

    $response = $this->actingAs($superadmin)->delete(route('roles.destroy', $systemRole));

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('roles', ['name' => 'superadmin']);
});

test('roles currently assigned to users cannot be deleted', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $customRole = Role::create([
        'name' => 'custom_auditor',
        'label' => 'Custom Auditor',
        'permissions' => ['pcd.dashboard'],
        'is_system' => false,
    ]);

    // Assign custom role to a user
    User::factory()->create([
        'roles' => ['custom_auditor'],
        'role' => 'custom_auditor',
    ]);

    $response = $this->actingAs($superadmin)->delete(route('roles.destroy', $customRole));

    $response->assertSessionHas('error');
    $this->assertDatabaseHas('roles', ['name' => 'custom_auditor']);
});

test('unassigned custom roles can be deleted', function () {
    $superadmin = User::factory()->create([
        'roles' => ['superadmin'],
        'role' => 'superadmin',
    ]);

    $customRole = Role::create([
        'name' => 'temporary_test_role',
        'label' => 'Temporary Test Role',
        'permissions' => ['pcd.dashboard'],
        'is_system' => false,
    ]);

    $response = $this->actingAs($superadmin)->delete(route('roles.destroy', $customRole));

    $response->assertRedirect(route('roles.index'));
    $this->assertDatabaseMissing('roles', ['name' => 'temporary_test_role']);
});
