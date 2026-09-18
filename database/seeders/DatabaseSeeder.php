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
                'password' => Hash::make('password'),
                'role' => UserRole::Superadmin,
            ]
        );

        Dealer::create([
            'kode_dealer' => '9226',
            'nama_dealer' => 'PT. Astra International Tbk-Honda - Ampenan',
        ])
            ->create([
                'kode_dealer' => 'N02',
                'nama_dealer' => 'Astra Motor Mataram - Main Dealer',
            ])
            ->create([
                'kode_dealer' => '9224',
                'nama_dealer' => 'PT. Astra International Tbk-Honda - Bima',
            ])
            ->create([
                'kode_dealer' => '9699',
                'nama_dealer' => 'PT. Astra International Tbk-Honda - Brawijaya',
            ])
            ->create([
                'kode_dealer' => '15583',
                'nama_dealer' => 'PT. Astra International Tbk-Honda - Kopang',
            ])
            ->create([
                'kode_dealer' => '9704',
                'nama_dealer' => 'PT. Astra International Tbk-Honda - Masbagik',
            ]);
    }
}
