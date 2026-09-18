<?php

namespace Database\Factories;

use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pameran>
 */
class PameranFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-1 month', '+1 month');
        $endDate = (clone $startDate)->modify('+'.fake()->numberBetween(3, 14).' days');

        return [
            'dealer_id' => Dealer::factory(),
            'jenis_pameran_id' => JenisPameran::factory(),
            'mulai_tanggal_sewa' => $startDate->format('Y-m-d'),
            'tanggal_sewa_berakhir' => $endDate->format('Y-m-d'),
            'kecamatan' => 'Kecamatan '.fake()->city(),
            'detail_alamat' => fake()->address(),
            'kode_pameran_ahm' => null,
            'latitude' => fake()->latitude(-8.7, -8.5),
            'longitude' => fake()->longitude(116.0, 116.3),
        ];
    }
}
