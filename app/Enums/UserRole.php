<?php

namespace App\Enums;

enum UserRole: string
{
    case Superadmin = 'superadmin';
    case Spv = 'spv';
    case Kabag = 'kabag';
    case Dealer = 'dealer';

    /**
     * Get a human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::Superadmin => 'Superadmin',
            self::Spv => 'SPV',
            self::Kabag => 'Kabag',
            self::Dealer => 'Dealer',
        };
    }
}
