<?php

namespace Database\Factories;

use App\Enums\BillboardLampStatus;
use App\Enums\BillboardPhysicalStatus;
use App\Models\Billboard;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Billboard>
 */
class BillboardFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tanggalPasang = fake()->dateTimeBetween('-6 months', 'now');

        return [
            'lokasi' => 'Jl. '.fake()->streetName().', Mataram',
            'latitude' => fake()->latitude(-8.70, -8.50),
            'longitude' => fake()->longitude(116.05, 116.20),
            'ukuran' => fake()->randomElement(['4 x 6 m', '5 x 10 m', '8 x 16 m']),
            'tanggal_pasang' => $tanggalPasang->format('Y-m-d'),
            'tanggal_berakhir' => (clone $tanggalPasang)->modify('+1 year')->format('Y-m-d'),
            'status_lampu' => fake()->randomElement(BillboardLampStatus::cases()),
            'status_fisik' => fake()->randomElement(BillboardPhysicalStatus::cases()),
            'foto_siang' => null,
            'foto_malam' => null,
            'foto_jarak_jauh' => null,
            'foto_jarak_dekat' => null,
        ];
    }
}
