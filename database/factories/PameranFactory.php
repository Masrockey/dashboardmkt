<?php

namespace Database\Factories;

use App\Enums\PameranStatus;
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
            'kabupaten' => 'Kota Mataram',
            'kecamatan' => 'Kecamatan '.fake()->city(),
            'detail_alamat' => fake()->address(),
            'kode_pameran_md' => null,
            'kode_pameran_ahm' => null,
            'status' => PameranStatus::MenungguSpv,
            'latitude' => fake()->latitude(-8.7, -8.5),
            'longitude' => fake()->longitude(116.0, 116.3),
        ];
    }

    /**
     * Indicate that the pameran is approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PameranStatus::Disetujui,
            'kode_pameran_md' => 'EXH-'.now()->format('Ymd').'-'.str_pad((string) fake()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'spv_approved_at' => now(),
            'kabag_approved_at' => now(),
        ]);
    }

    /**
     * Indicate that the pameran is waiting for Kabag approval.
     */
    public function pendingKabag(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PameranStatus::MenungguKabag,
            'spv_approved_at' => now(),
        ]);
    }

    /**
     * Indicate that the pameran is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PameranStatus::Ditolak,
            'catatan_penolakan' => 'Ditolak untuk revisi lokasi.',
        ]);
    }
}
