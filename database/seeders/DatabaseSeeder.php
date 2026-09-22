<?php

namespace Database\Seeders;

use App\Enums\UserRole;
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

        $dealers = [
            ['kode_dealer' => '9226', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Ampenan'],
            ['kode_dealer' => 'N02', 'nama_dealer' => 'Astra Motor Mataram - Main Dealer'],
            ['kode_dealer' => '9224', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Bima'],
            ['kode_dealer' => '9699', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Brawijaya'],
            ['kode_dealer' => '15583', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Kopang'],
            ['kode_dealer' => '9704', 'nama_dealer' => 'PT. Astra International Tbk-Honda - Masbagik'],
        ];

        foreach ($dealers as $dealer) {
            Dealer::firstOrCreate(['kode_dealer' => $dealer['kode_dealer']], $dealer);
        }
    }
}
