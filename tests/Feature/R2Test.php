<?php

use App\Enums\UserRole;
use App\Models\Brand;
use App\Models\Kabupaten;
use App\Models\R2;
use App\Models\Segment;
use App\Models\Type;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('guests are redirected to the login page when visiting r2 index', function () {
    $response = $this->get(route('r2.index'));

    $response->assertRedirect(route('login'));
});

test('unauthorized users (dealer) cannot access r2 menu', function () {
    $user = User::factory()->create(['role' => UserRole::Dealer]);

    $response = $this->actingAs($user)->get(route('r2.index'));

    $response->assertStatus(403);
});

test('spv, kabag, and superadmin users can view the r2 index page', function () {
    foreach ([UserRole::Spv, UserRole::Kabag, UserRole::Superadmin] as $role) {
        $user = User::factory()->create(['role' => $role]);

        $response = $this->actingAs($user)->get(route('r2.index'));

        $response->assertOk();
    }
});

test('authorized users can create an r2 record with all 22 fields', function () {
    $user = User::factory()->create(['role' => UserRole::Spv]);

    $data = [
        'drv_desc' => 'Driver Test',
        'knd_nopol' => 'EA 9999 XX',
        'knd_nama' => 'Budi Santoso',
        'knd_alamat' => 'Jl. Merdeka No 123',
        'kel_desc' => 'Pejanggik',
        'kec_desc' => 'Mataram',
        'kab_desc' => 'KOTA MATARAM',
        'jns_desc' => 'SEPEDA MOTOR',
        'mrk_desc' => 'HONDA',
        'pkb_desc' => 'PKB 2026',
        'knd_thn_buat' => '2025',
        'knd_cyl' => '150',
        'knd_rangka' => 'MH1KC12345678',
        'knd_mesin' => 'KC12E1234567',
        'knd_warna' => 'HITAM',
        'guna_desc' => 'PRIBADI',
        'wrn_desc' => 'HITAM',
        'ctk_notice_tanggal' => '2026-01-15',
        'ctk_notice_seri' => 'SERI-001',
        'knd_tgl_notice_new' => '2026-01-15',
        'knd_tgl_notice_old' => '2025-01-15',
        'knd_df_jenis' => 'DAFTAR ULANG',
    ];

    $response = $this->actingAs($user)->post(route('r2.store'), $data);

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseHas('r2s', [
        'knd_nopol' => 'EA 9999 XX',
        'knd_nama' => 'Budi Santoso',
        'mrk_desc' => 'HONDA',
    ]);
});

test('authorized users can update an r2 record', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $r2 = R2::create([
        'knd_nopol' => 'EA 1111 XX',
        'knd_nama' => 'Ahmad',
    ]);

    $response = $this->actingAs($user)->put(route('r2.update', $r2), [
        'knd_nopol' => 'EA 2222 XX',
        'knd_nama' => 'Ahmad Updated',
        'mrk_desc' => 'YAMAHA',
    ]);

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseHas('r2s', [
        'id' => $r2->id,
        'knd_nopol' => 'EA 2222 XX',
        'knd_nama' => 'Ahmad Updated',
        'mrk_desc' => 'YAMAHA',
    ]);
});

test('authorized users can delete an r2 record', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $r2 = R2::create(['knd_nopol' => 'EA 3333 XX']);

    $response = $this->actingAs($user)->delete(route('r2.destroy', $r2));

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseMissing('r2s', [
        'id' => $r2->id,
    ]);
});

test('authorized users can import r2 records from excel file', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $file = UploadedFile::fake()->create('import_r2.xlsx', 10, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    $response = $this->actingAs($user)->post(route('r2.import'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('r2.index'));
});

test('r2 auto-populates segment and nama_pasar from master data type on create and update', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);

    $segment = Segment::create(['nama_segment' => 'AT HIGH']);
    Brand::create(['nama_brand' => 'HONDA']);
    Kabupaten::create(['nama_kabupaten' => 'LOMBOK TIMUR']);
    Type::create([
        'nama_type' => 'X1H02N32L1 A/T',
        'segment_id' => $segment->id,
        'nama_pasar' => 'Vario 160 CBS',
    ]);

    $response = $this->actingAs($user)->post(route('r2.store'), [
        'knd_nopol' => 'DR 1234 AB',
        'knd_nama' => 'Test Master Sync',
        'kab_desc' => 'lombok timur',
        'mrk_desc' => 'honda',
        'type' => 'X1H02N32L1 A/T',
        'model' => 'SEPEDA MOTOR',
        'roda' => '2',
    ]);

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseHas('r2s', [
        'knd_nopol' => 'DR 1234 AB',
        'kab_desc' => 'LOMBOK TIMUR',
        'mrk_desc' => 'HONDA',
        'type' => 'X1H02N32L1 A/T',
        'segment' => 'AT HIGH',
        'nama_pasar' => 'Vario 160 CBS',
        'model' => 'SEPEDA MOTOR',
        'roda' => '2',
    ]);
});
