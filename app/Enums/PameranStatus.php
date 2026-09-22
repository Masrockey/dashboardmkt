<?php

namespace App\Enums;

enum PameranStatus: string
{
    case MenungguSpv = 'menunggu_spv';
    case MenungguKabag = 'menunggu_kabag';
    case Disetujui = 'disetujui';
    case Ditolak = 'ditolak';

    /**
     * Get a human-readable label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::MenungguSpv => 'Menunggu Approval SPV',
            self::MenungguKabag => 'Menunggu Approval Kabag',
            self::Disetujui => 'Disetujui',
            self::Ditolak => 'Ditolak',
        };
    }
}
