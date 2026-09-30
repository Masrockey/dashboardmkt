<?php

use App\Enums\UserRole;
use App\Models\Segment;
use App\Models\Type;
use App\Models\User;

test('guests are redirected to the login page when visiting types', function () {
    $response = $this->get(route('types.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users cannot access types', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('types.index'));

    $response->assertStatus(403);
});

test('superadmin or spv users can view the types page', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($user)->get(route('types.index'));

    $response->assertOk();
});

test('authorized users can create a type', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);
    $segment = Segment::create(['nama_segment' => 'AT HIGH']);

    $response = $this->actingAs($user)->post(route('types.store'), [
        'nama_type' => 'VARIO 160',
        'segment_id' => $segment->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'nama_type' => 'VARIO 160',
        'segment_id' => $segment->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);
});

test('authorized users can update a type', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $segment1 = Segment::create(['nama_segment' => 'AT HIGH']);
    $segment2 = Segment::create(['nama_segment' => 'AT MID']);
    $type = Type::create([
        'nama_type' => 'VARIO 160',
        'segment_id' => $segment1->id,
        'nama_pasar' => 'VARIO 160 CBS',
    ]);

    $response = $this->actingAs($user)->put(route('types.update', $type), [
        'nama_type' => 'BEAT FI',
        'segment_id' => $segment2->id,
        'nama_pasar' => 'BEAT SPORTY CBS',
    ]);

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseHas('types', [
        'id' => $type->id,
        'nama_type' => 'BEAT FI',
        'segment_id' => $segment2->id,
        'nama_pasar' => 'BEAT SPORTY CBS',
    ]);
});

test('authorized users can delete a type', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $type = Type::create(['nama_type' => 'VARIO 160']);

    $response = $this->actingAs($user)->delete(route('types.destroy', $type));

    $response->assertRedirect(route('types.index'));

    $this->assertDatabaseMissing('types', [
        'id' => $type->id,
    ]);
});
