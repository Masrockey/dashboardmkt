<?php

use App\Enums\UserRole;
use App\Models\R2;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected to login when visiting marketing dashboard', function () {
    $response = $this->get(route('marketing.dashboard'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users (dealer) cannot access marketing dashboard', function () {
    $dealer = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($dealer)->get(route('marketing.dashboard'));

    $response->assertStatus(403);
});

test('authorized users (spv, kabag, superadmin) can view marketing dashboard', function () {
    foreach ([UserRole::Spv, UserRole::Kabag, UserRole::Superadmin] as $role) {
        $user = User::factory()->create(['role' => $role]);

        $response = $this->actingAs($user)->get(route('marketing.dashboard'));

        $response->assertOk();
    }
});

test('marketing dashboard renders correct inertia component and calculated stats', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    // Create 3 Honda units
    R2::create([
        'knd_nopol' => 'DR 1111 AA',
        'knd_nama' => 'User Honda 1',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Mataram',
        'knd_thn_buat' => '2024',
        'knd_cyl' => '150',
        'guna_desc' => 'PRIBADI',
        'ctk_notice_tanggal' => '2026-01-10',
    ]);
    R2::create([
        'knd_nopol' => 'DR 2222 BB',
        'knd_nama' => 'User Honda 2',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Ampenan',
        'knd_thn_buat' => '2023',
        'knd_cyl' => '110',
        'guna_desc' => 'PRIBADI',
        'ctk_notice_tanggal' => '2026-01-15',
    ]);
    R2::create([
        'knd_nopol' => 'EA 3333 CC',
        'knd_nama' => 'User Honda 3',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KAB. LOMBOK BARAT',
        'kec_desc' => 'Gerung',
        'knd_thn_buat' => '2024',
        'knd_cyl' => '160',
        'guna_desc' => 'DINAS',
        'ctk_notice_tanggal' => '2026-02-01',
    ]);

    // Create 1 Competitor unit
    R2::create([
        'knd_nopol' => 'DR 4444 DD',
        'knd_nama' => 'User Yamaha 1',
        'mrk_desc' => 'YAMAHA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Mataram',
        'knd_thn_buat' => '2024',
        'knd_cyl' => '155',
        'guna_desc' => 'PRIBADI',
        'ctk_notice_tanggal' => '2026-01-20',
    ]);

    $this->actingAs($user)
        ->get(route('marketing.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('marketing/dashboard')
            ->has('stats')
            ->where('stats.total_units', 4)
            ->where('stats.honda_units', 3)
            ->where('stats.competitor_units', 1)
            ->where('stats.honda_market_share', 75)
            ->where('stats.competitor_market_share', 25)
            ->where('stats.total_kabupaten', 2)
            ->where('stats.total_kecamatan', 3)
            ->has('brandDistribution', 2)
            ->has('kabupatenDistribution', 2)
            ->has('topKecamatan')
            ->has('cylinderSegments')
            ->has('usageDistribution')
            ->has('recentRegistrations', 4)
            ->has('filterOptions')
            ->has('filters')
        );
});

test('marketing dashboard filters by kabupaten and brand correctly', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    R2::create([
        'knd_nopol' => 'DR 1001 AA',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Mataram',
        'knd_thn_buat' => '2024',
        'ctk_notice_tanggal' => '2026-01-10',
    ]);
    R2::create([
        'knd_nopol' => 'DR 1002 BB',
        'mrk_desc' => 'YAMAHA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Mataram',
        'knd_thn_buat' => '2024',
        'ctk_notice_tanggal' => '2026-01-15',
    ]);
    R2::create([
        'knd_nopol' => 'EA 2001 CC',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KAB. SUMBAWA',
        'kec_desc' => 'Sumbawa',
        'knd_thn_buat' => '2023',
        'ctk_notice_tanggal' => '2026-02-10',
    ]);

    // Test filtering by kabupaten
    $this->actingAs($user)
        ->get(route('marketing.dashboard', ['kabupaten' => 'KAB. SUMBAWA']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('marketing/dashboard')
            ->where('stats.total_units', 1)
            ->where('stats.honda_units', 1)
            ->where('filters.kabupaten', 'KAB. SUMBAWA')
        );

    // Test filtering by brand
    $this->actingAs($user)
        ->get(route('marketing.dashboard', ['brand' => 'YAMAHA']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('marketing/dashboard')
            ->where('stats.total_units', 1)
            ->where('stats.honda_units', 0)
            ->where('stats.competitor_units', 1)
            ->where('filters.brand', 'YAMAHA')
        );
});

test('marketing dashboard provides geographic coordinates and detailed statistics for map markers', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    R2::create([
        'knd_nopol' => 'DR 1111 AA',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KOTA MATARAM',
        'kec_desc' => 'Mataram',
        'knd_thn_buat' => '2024',
        'ctk_notice_tanggal' => '2026-01-10',
    ]);

    R2::create([
        'knd_nopol' => 'EA 2222 BB',
        'mrk_desc' => 'HONDA',
        'kab_desc' => 'KAB. LOMBOK TIMUR',
        'kec_desc' => 'Selong',
        'knd_thn_buat' => '2024',
        'ctk_notice_tanggal' => '2026-01-15',
    ]);

    $this->actingAs($user)
        ->get(route('marketing.dashboard'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('marketing/dashboard')
            ->has('kabupatenDistribution.0', fn (AssertableInertia $kab) => $kab
                ->has('kabupaten')
                ->has('total')
                ->has('honda_count')
                ->has('competitor_count')
                ->has('honda_share')
                ->has('percentage_of_total')
                ->has('latitude')
                ->has('longitude')
                ->has('capital')
                ->has('top_brands')
                ->has('top_kecamatans')
                ->has('kecamatans')
            )
        );
});
