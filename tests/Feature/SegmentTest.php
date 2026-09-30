<?php

use App\Enums\UserRole;
use App\Models\Segment;
use App\Models\User;

test('guests are redirected to the login page when visiting segments', function () {
    $response = $this->get(route('segments.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access segments', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('segments.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the segments page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('segments.index'));

    $response->assertOk();
});

test('authorized users can create a segment', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    $response = $this->actingAs($user)->post(route('segments.store'), [
        'nama_segment' => 'Modern Market',
    ]);

    $response->assertRedirect(route('segments.index'));

    $this->assertDatabaseHas('segments', [
        'nama_segment' => 'Modern Market',
    ]);
});

test('nama segment must be unique when creating', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    Segment::create(['nama_segment' => 'Modern Market']);

    $response = $this->actingAs($user)->post(route('segments.store'), [
        'nama_segment' => 'Modern Market',
    ]);

    $response->assertSessionHasErrors(['nama_segment']);
});

test('authorized users can update a segment', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $segment = Segment::create(['nama_segment' => 'Modern Market']);

    $response = $this->actingAs($user)->put(route('segments.update', $segment), [
        'nama_segment' => 'Traditional Market',
    ]);

    $response->assertRedirect(route('segments.index'));

    $this->assertDatabaseHas('segments', [
        'id' => $segment->id,
        'nama_segment' => 'Traditional Market',
    ]);
});

test('authorized users can delete a segment', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $segment = Segment::create(['nama_segment' => 'Modern Market']);

    $response = $this->actingAs($user)->delete(route('segments.destroy', $segment));

    $response->assertRedirect(route('segments.index'));

    $this->assertDatabaseMissing('segments', [
        'id' => $segment->id,
    ]);
});
