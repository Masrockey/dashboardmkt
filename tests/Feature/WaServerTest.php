<?php

use App\Enums\PameranStatus;
use App\Enums\UserRole;
use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use App\Models\Role;
use App\Models\User;
use App\Models\WaServerSetting;
use Illuminate\Support\Facades\Http;

test('wa channel approval notification sends message to target group', function () {
    Http::fake([
        '*/send/message' => Http::response([
            'status' => 'success',
            'results' => [
                'message_id' => 'MSG_123456789',
            ],
        ], 200),
    ]);

    $setting = WaServerSetting::current();
    $setting->update([
        'target_group_jid' => '120363432126043755@g.us',
        'target_group_name' => 'Grup Test Channel',
    ]);

    $dealer = Dealer::factory()->create(['nama_dealer' => 'SO Ampenan', 'kode_dealer' => '9226']);
    $jenis = JenisPameran::factory()->create(['jenis_pameran' => 'Pameran Tenda', 'kode_pameran' => 'PMR', 'radius_km' => 2]);
    $spvUser = User::factory()->create(['name' => 'Supervisor NTB', 'role' => UserRole::Spv]);

    $pameran = Pameran::factory()->create([
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenis->id,
        'status' => PameranStatus::MenungguSpv,
        'mulai_tanggal_sewa' => '2026-11-02',
        'tanggal_sewa_berakhir' => '2026-11-30',
        'kecamatan' => 'Kekeri',
        'kabupaten' => 'Lombok Barat',
        'detail_alamat' => 'Perumahan Bellpark 2',
        'latitude' => -8.556323,
        'longitude' => 116.126300,
    ]);

    $this->actingAs($spvUser)->post(route('pameran.approve-spv', $pameran), [
        'catatan_approval' => 'Lokasi strategis dan aman.',
    ])->assertRedirect();

    $pameran->refresh();
    expect($pameran->status)->toBe(PameranStatus::Disetujui);
    expect($pameran->catatan_approval)->toBe('Lokasi strategis dan aman.');

    Http::assertSent(function ($request) {
        $body = $request->data();

        return str_contains($request->url(), '/send/message')
            && ($body['phone'] ?? '') === '120363432126043755@g.us'
            && str_contains($body['message'] ?? '', 'NOTIFIKASI APPROVAL CHANNEL')
            && str_contains($body['message'] ?? '', 'SO Ampenan')
            && str_contains($body['message'] ?? '', 'Pameran Tenda')
            && str_contains($body['message'] ?? '', 'Lokasi strategis dan aman.');
    });
});

test('approval succeeds gracefully even if WA server fails', function () {
    Http::fake([
        '*/send/message' => Http::response(['error' => 'WA Server Timeout'], 500),
    ]);

    $setting = WaServerSetting::current();
    $setting->update([
        'target_group_jid' => '120363432126043755@g.us',
    ]);

    $pameran = Pameran::factory()->create(['status' => PameranStatus::MenungguSpv]);
    $spvUser = User::factory()->create(['role' => UserRole::Spv]);

    $this->actingAs($spvUser)->post(route('pameran.approve-spv', $pameran))->assertRedirect();

    $pameran->refresh();
    expect($pameran->status)->toBe(PameranStatus::Disetujui);
    expect($pameran->kode_pameran_md)->not->toBeNull();
});

test('superadmin can access wa server page and update target group', function () {
    $superadmin = User::factory()->create(['role' => UserRole::Superadmin]);

    $this->actingAs($superadmin)
        ->get(route('wa-server.index'))
        ->assertOk();

    $this->actingAs($superadmin)
        ->post(route('wa-server.target-group'), [
            'target_group_jid' => '1234567890@g.us',
            'target_group_name' => 'Channel Approval Group',
        ])
        ->assertRedirect();

    $setting = WaServerSetting::current();
    expect($setting->target_group_jid)->toBe('1234567890@g.us');
    expect($setting->target_group_name)->toBe('Channel Approval Group');
});

test('superadmin can fetch real-time wa groups', function () {
    Http::fake([
        '*/user/my/groups' => Http::response([
            'code' => 'SUCCESS',
            'message' => 'Success get list groups',
            'results' => [
                'data' => [
                    [
                        'JID' => '120363432028723651@g.us',
                        'Name' => 'Test Notif MKT',
                    ],
                ],
            ],
        ], 200),
    ]);

    $superadmin = User::factory()->create(['role' => UserRole::Superadmin]);

    $response = $this->actingAs($superadmin)
        ->get(route('wa-server.groups'))
        ->assertOk()
        ->assertJson([
            'success' => true,
            'count' => 1,
            'groups' => [
                [
                    'jid' => '120363432028723651@g.us',
                    'name' => 'Test Notif MKT',
                ],
            ],
        ]);

    expect($response->json('groups'))->toHaveCount(1);
});

test('dealer cannot access wa server page', function () {
    $dealer = User::factory()->create(['role' => UserRole::Dealer]);

    $this->actingAs($dealer)
        ->get(route('wa-server.index'))
        ->assertForbidden();
});

test('user with only read permission can view wa server page but cannot modify settings or target group', function () {
    $role = Role::create([
        'name' => 'wa_viewer',
        'label' => 'WA Viewer',
        'permissions' => ['management.wa_server.read'],
        'is_system' => false,
    ]);

    $user = User::factory()->create([
        'roles' => ['wa_viewer'],
        'role' => 'wa_viewer',
    ]);

    $this->actingAs($user)
        ->get(route('wa-server.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('wa-server/index')
            ->where('can.write', false)
            ->where('settings.server_url', '')
        );

    $this->actingAs($user)
        ->post(route('wa-server.target-group'), [
            'target_group_jid' => '1234567890@g.us',
        ])
        ->assertForbidden();

    $this->actingAs($user)
        ->post(route('wa-server.settings'), [
            'server_url' => 'https://example.com',
            'device_id' => 'hack',
        ])
        ->assertForbidden();
});

test('user with connect permission can connect wa and set target group but cannot modify server api settings', function () {
    Http::fake([
        '*/app/login/qr' => Http::response([
            'success' => true,
            'qr_link' => 'https://example.com/qr.png',
        ], 200),
        '*/send/message' => Http::response([
            'status' => 'success',
            'results' => ['message_id' => 'MSG_TEST'],
        ], 200),
    ]);

    $role = Role::create([
        'name' => 'wa_connector',
        'label' => 'WA Connector',
        'permissions' => ['management.wa_server.connect'],
        'is_system' => false,
    ]);

    $user = User::factory()->create([
        'roles' => ['wa_connector'],
        'role' => 'wa_connector',
    ]);

    $this->actingAs($user)
        ->get(route('wa-server.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('wa-server/index')
            ->where('can.connect', true)
            ->where('can.manage_server', false)
            ->where('can.write', false)
            ->where('settings.server_url', '')
        );

    // Can set target group
    $this->actingAs($user)
        ->post(route('wa-server.target-group'), [
            'target_group_jid' => '120363432028723651@g.us',
            'target_group_name' => 'Test Notif MKT',
        ])
        ->assertRedirect();

    $setting = WaServerSetting::current();
    expect($setting->target_group_jid)->toBe('120363432028723651@g.us');
    expect($setting->target_group_name)->toBe('Test Notif MKT');

    // Can get QR code
    $this->actingAs($user)
        ->get(route('wa-server.qr'))
        ->assertOk();

    // Can send test message
    $this->actingAs($user)
        ->postJson(route('wa-server.test-message'), [
            'phone' => '120363432028723651@g.us',
            'message' => 'Tes pesan dari connector',
        ])
        ->assertOk();

    // Cannot modify server settings
    $this->actingAs($user)
        ->post(route('wa-server.settings'), [
            'server_url' => 'https://hack.com',
            'device_id' => 'hack_device',
        ])
        ->assertForbidden();

    // Cannot reconnect server device
    $this->actingAs($user)
        ->post(route('wa-server.reconnect'))
        ->assertForbidden();
});

test('wa channel creation notification sends message to target group when new channel created', function () {
    Http::fake([
        '*/send/message' => Http::response([
            'status' => 'success',
            'results' => [
                'message_id' => 'MSG_CREATED_123',
            ],
        ], 200),
    ]);

    $setting = WaServerSetting::current();
    $setting->update([
        'target_group_jid' => '120363432126043755@g.us',
        'target_group_name' => 'Grup Test Channel',
    ]);

    $dealer = Dealer::factory()->create(['nama_dealer' => 'SO Ampenan', 'kode_dealer' => '9226']);
    $jenis = JenisPameran::factory()->create(['jenis_pameran' => 'Pameran Tenda', 'kode_pameran' => 'PMR', 'radius_km' => 2]);
    $user = User::factory()->create(['name' => 'Staff Dealer', 'role' => UserRole::Dealer, 'dealer_id' => $dealer->id]);

    $response = $this->actingAs($user)->post(route('pameran.store'), [
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenis->id,
        'mulai_tanggal_sewa' => '2026-11-02',
        'tanggal_sewa_berakhir' => '2026-11-10',
        'kecamatan' => 'Kekeri',
        'kabupaten' => 'Lombok Barat',
        'detail_alamat' => 'Perumahan Bellpark 2',
        'latitude' => -8.556323,
        'longitude' => 116.126300,
    ]);

    $response->assertRedirect(route('pameran.index'));

    Http::assertSent(function ($request) {
        $body = $request->data();

        return str_contains($request->url(), '/send/message')
            && ($body['phone'] ?? '') === '120363432126043755@g.us'
            && str_contains($body['message'] ?? '', 'PENGAJUAN CHANNEL BARU')
            && str_contains($body['message'] ?? '', 'Menunggu Persetujuan SPV')
            && str_contains($body['message'] ?? '', 'SO Ampenan')
            && str_contains($body['message'] ?? '', 'Pameran Tenda')
            && str_contains($body['message'] ?? '', 'Perumahan Bellpark 2');
    });
});

test('wa channel rejection notification sends message to target group when channel rejected', function () {
    Http::fake([
        '*/send/message' => Http::response([
            'status' => 'success',
            'results' => [
                'message_id' => 'MSG_REJECTED_123',
            ],
        ], 200),
    ]);

    $setting = WaServerSetting::current();
    $setting->update([
        'target_group_jid' => '120363432126043755@g.us',
        'target_group_name' => 'Grup Test Channel',
    ]);

    $dealer = Dealer::factory()->create(['nama_dealer' => 'SO Ampenan', 'kode_dealer' => '9226']);
    $jenis = JenisPameran::factory()->create(['jenis_pameran' => 'Pameran Tenda', 'kode_pameran' => 'PMR', 'radius_km' => 2]);
    $spvUser = User::factory()->create(['name' => 'Supervisor NTB', 'role' => UserRole::Spv]);

    $pameran = Pameran::factory()->create([
        'dealer_id' => $dealer->id,
        'jenis_pameran_id' => $jenis->id,
        'status' => PameranStatus::MenungguSpv,
        'mulai_tanggal_sewa' => '2026-11-02',
        'tanggal_sewa_berakhir' => '2026-11-30',
        'kecamatan' => 'Kekeri',
        'kabupaten' => 'Lombok Barat',
        'detail_alamat' => 'Perumahan Bellpark 2',
        'latitude' => -8.556323,
        'longitude' => 116.126300,
    ]);

    $this->actingAs($spvUser)->post(route('pameran.reject', $pameran), [
        'catatan_penolakan' => 'Menimpa radius channel dealer lain.',
    ])->assertRedirect();

    $pameran->refresh();
    expect($pameran->status)->toBe(PameranStatus::Ditolak);
    expect($pameran->catatan_penolakan)->toBe('Menimpa radius channel dealer lain.');

    Http::assertSent(function ($request) {
        $body = $request->data();

        return str_contains($request->url(), '/send/message')
            && ($body['phone'] ?? '') === '120363432126043755@g.us'
            && str_contains($body['message'] ?? '', 'NOTIFIKASI PENOLAKAN CHANNEL')
            && str_contains($body['message'] ?? '', 'Ditolak')
            && str_contains($body['message'] ?? '', 'Menimpa radius channel dealer lain.')
            && str_contains($body['message'] ?? '', 'SO Ampenan');
    });
});
