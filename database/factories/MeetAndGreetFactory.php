<?php

namespace Database\Factories;

use App\Models\Dealer;
use App\Models\MeetAndGreet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MeetAndGreet>
 */
class MeetAndGreetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dealer_id' => Dealer::factory(),
            'nama_konsumen' => fake()->name(),
            'alamat' => fake()->address(),
            'no_hp' => fake()->numerify('081#########'),
            'tipe_motor' => fake()->randomElement(['PCX 160', 'Vario 160', 'ADV 160', 'Beat']),
            'no_plat' => 'DR '.fake()->numerify('####').' '.strtoupper(fake()->lexify('??')),
            'stnk_path' => null,
            'created_by_user_id' => null,
        ];
    }
}
