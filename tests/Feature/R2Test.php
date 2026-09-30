<?php

use App\Enums\UserRole;
use App\Models\R2;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('guests are redirected to the login page when visiting r2 index', function () {
    $response = $this->get(route('r2.index'));

    $response->assertRedirect(route('login'));
});

test('authenticated users can view the r2 index page', function () {
    $user = User::factory()->create(['role' => UserRole::Kabag]);

    $response = $this->actingAs($user)->get(route('r2.index'));

    $response->assertOk();
});

test('authenticated users can create an r2 record with all 22 fields', function () {
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

test('authenticated users can update an r2 record', function () {
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

test('authenticated users can delete an r2 record', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $r2 = R2::create(['knd_nopol' => 'EA 3333 XX']);

    $response = $this->actingAs($user)->delete(route('r2.destroy', $r2));

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseMissing('r2s', [
        'id' => $r2->id,
    ]);
});

test('authenticated users can import r2 records from excel file', function () {
    $user = User::factory()->create(['role' => UserRole::Superadmin]);
    $filePath = base_path('contoh import.xlsx');

    $file = new UploadedFile(
        $filePath,
        'contoh import.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        null,
        true
    );

    $response = $this->actingAs($user)->post(route('r2.import'), [
        'file' => $file,
    ]);

    $response->assertRedirect(route('r2.index'));

    $this->assertDatabaseHas('r2s', [
        'knd_nopol' => 'EA6957YI',
        'knd_nama' => 'DAMAR',
        'mrk_desc' => 'HONDA',
    ]);
});
