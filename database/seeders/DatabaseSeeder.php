<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'admin@dashboard.com'],
            [
                'name' => 'admin',
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => UserRole::Superadmin,
            ]
        );

        User::firstOrCreate(
            ['email' => 'kabag@dashboard.com'],
            [
                'name' => 'kabag',
                'username' => 'kabag',
                'password' => Hash::make('password'),
                'role' => UserRole::Kabag,
            ]
        );

        User::firstOrCreate(
            ['email' => 'spv@dashboard.com'],
            [
                'name' => 'spv',
                'username' => 'spv',
                'password' => Hash::make('password'),
                'role' => UserRole::Spv,
            ]
        );

        $this->call([
            CategorySeeder::class,
            SegmentSeeder::class,
            BrandSeeder::class,
            KabupatenSeeder::class,
        ]);

        $hondaCategory = Category::where('nama_kategori', 'HONDA')->first();

        $dealers = [
            ['kode_dealer' => '9226', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Ampenan', 'category_id' => $hondaCategory?->id],
            ['kode_dealer' => 'N02', 'nama_dealer' => 'Astra Motor Mataram - Main Dealer', 'category_id' => $hondaCategory?->id],
            ['kode_dealer' => '9224', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Bima', 'category_id' => $hondaCategory?->id],
            ['kode_dealer' => '9699', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Brawijaya', 'category_id' => $hondaCategory?->id],
            ['kode_dealer' => '15583', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Kopang', 'category_id' => $hondaCategory?->id],
            ['kode_dealer' => '9704', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Masbagik', 'category_id' => $hondaCategory?->id],
        ];

        foreach ($dealers as $dealer) {
            Dealer::firstOrCreate(['kode_dealer' => $dealer['kode_dealer']], $dealer);
        }

        $this->call([
            TypeSeeder::class,
        ]);
    }
}
