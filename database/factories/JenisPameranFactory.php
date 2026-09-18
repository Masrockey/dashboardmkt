<?php

namespace Database\Factories;

use App\Models\JenisPameran;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<JenisPameran>
 */
class JenisPameranFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kode_pameran' => 'EXH'.fake()->unique()->numerify('####'),
            'jenis_pameran' => fake()->words(2, true).' Expo',
            'icon_map' => null,
        ];
    }
}
