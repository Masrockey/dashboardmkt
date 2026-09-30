<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $brandCategories = [
            ['brand' => 'APP KTM', 'category' => 'OTHERS'],
            ['brand' => 'AAP KTM', 'category' => 'OTHERS'],
            ['brand' => 'BENELLI', 'category' => 'OTHERS'],
            ['brand' => 'HOLDEN', 'category' => 'OTHERS'],
            ['brand' => 'BAJAJ', 'category' => 'OTHERS'],
            ['brand' => 'KANZEN', 'category' => 'OTHERS'],
            ['brand' => 'DIABLO', 'category' => 'OTHERS'],
            ['brand' => 'HONDA', 'category' => 'HONDA'],
            ['brand' => 'NOZOMI', 'category' => 'OTHERS'],
            ['brand' => 'BEIJING', 'category' => 'OTHERS'],
            ['brand' => 'ROYAL ENFIELD', 'category' => 'OTHERS'],
            ['brand' => 'KTM', 'category' => 'OTHERS'],
            ['brand' => 'V I A R', 'category' => 'OTHERS'],
            ['brand' => 'TVS', 'category' => 'OTHERS'],
            ['brand' => 'HARLEY DAVIDSON', 'category' => 'OTHERS'],
            ['brand' => 'MONTRADA', 'category' => 'OTHERS'],
            ['brand' => 'JIALING', 'category' => 'OTHERS'],
            ['brand' => 'KAWASAKI', 'category' => 'OTHERS'],
            ['brand' => 'SUZUKI', 'category' => 'SUZUKI'],
            ['brand' => 'TORINDO', 'category' => 'OTHERS'],
            ['brand' => 'PRISMA', 'category' => 'OTHERS'],
            ['brand' => 'TOSSA', 'category' => 'OTHERS'],
            ['brand' => 'KASAWAKI', 'category' => 'OTHERS'],
            ['brand' => 'KAISAR', 'category' => 'OTHERS'],
            ['brand' => 'VIAR', 'category' => 'OTHERS'],
            ['brand' => 'KYMCO', 'category' => 'OTHERS'],
            ['brand' => 'YAMAHA', 'category' => 'YAMAHA'],
            ['brand' => 'Y A M A H A', 'category' => 'YAMAHA'],
            ['brand' => 'PIAGGIO', 'category' => 'OTHERS'],
            ['brand' => 'MONSTRAC', 'category' => 'OTHERS'],
            ['brand' => 'VESPA', 'category' => 'OTHERS'],
            ['brand' => 'GESITS', 'category' => 'OTHERS'],
        ];

        foreach ($brandCategories as $item) {
            $category = Category::firstOrCreate(['nama_kategori' => $item['category']]);

            Brand::firstOrCreate(
                ['nama_brand' => $item['brand']],
                ['category_id' => $category->id]
            );
        }
    }
}
