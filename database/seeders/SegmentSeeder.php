<?php

namespace Database\Seeders;

use App\Models\Segment;
use Illuminate\Database\Seeder;

class SegmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $segments = [
            'AT HIGH',
            'AT LOW',
            'AT MID',
            'CUB HIGH',
            'CUB LOW',
            'CUB MID',
            'SPORT HIGH',
            'SPORT LOW',
            'SPORT MID',
            'UNCATEGORY',
        ];

        foreach ($segments as $namaSegment) {
            Segment::firstOrCreate(['nama_segment' => $namaSegment]);
        }
    }
}
