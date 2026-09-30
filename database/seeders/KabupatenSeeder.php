<?php

namespace Database\Seeders;

use App\Models\Kabupaten;
use Illuminate\Database\Seeder;

class KabupatenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kabupatens = [
            'KAB. BIMA',
            'KAB. DOMPU',
            'KAB. LOMBOK BARAT',
            'KAB. LOMBOK TENGAH',
            'KAB. LOMBOK TIMUR',
            'KAB. LOMBOK UTARA',
            'KAB. SUMBAWA',
            'KAB. SUMBAWA BARAT',
            'KOTA BIMA',
            'KOTA MATARAM',
        ];

        foreach ($kabupatens as $namaKabupaten) {
            Kabupaten::firstOrCreate(['nama_kabupaten' => $namaKabupaten]);
        }
    }
}
