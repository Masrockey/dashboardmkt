<?php

namespace App\Enums;

enum BillboardLampStatus: string
{
    case Menyala = 'menyala';
    case Mati = 'mati';
    case TanpaLampu = 'tanpa_lampu';

    /**
     * Get a human-readable label for the lamp status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Menyala => 'Menyala',
            self::Mati => 'Mati',
            self::TanpaLampu => 'Tanpa Lampu',
        };
    }
}
