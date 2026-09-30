<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'HONDA',
            'OTHERS',
            'SUZUKI',
            'YAMAHA',
        ];

        foreach ($categories as $namaKategori) {
            Category::firstOrCreate(['nama_kategori' => $namaKategori]);
        }
    }
}
