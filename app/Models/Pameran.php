<?php

namespace App\Models;

use Database\Factories\PameranFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pameran extends Model
{
    /** @use HasFactory<PameranFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode_pameran_md',
        'kode_pameran_ahm',
        'dealer_id',
        'jenis_pameran_id',
        'mulai_tanggal_sewa',
        'tanggal_sewa_berakhir',
        'kecamatan',
        'detail_alamat',
        'latitude',
        'longitude',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Pameran $pameran) {
            if (empty($pameran->kode_pameran_md)) {
                $jenisPameran = $pameran->relationLoaded('jenisPameran') && $pameran->jenisPameran
                    ? $pameran->jenisPameran
                    : $pameran->jenis_pameran_id;

                $pameran->kode_pameran_md = static::generateKodePameranMd($jenisPameran);
            }
        });
    }

    /**
     * Generate sequential exhibition code for Main Dealer in format: [kode pameran]-YYYYMMDD-XXXX.
     */
    public static function generateKodePameranMd(int|string|JenisPameran|null $jenisPameran = null): string
    {
        $kodePameran = 'MD';

        if ($jenisPameran instanceof JenisPameran) {
            $kodePameran = $jenisPameran->kode_pameran ?: 'MD';
        } elseif (is_numeric($jenisPameran)) {
            $found = JenisPameran::find($jenisPameran);
            if ($found && ! empty($found->kode_pameran)) {
                $kodePameran = $found->kode_pameran;
            }
        } elseif (is_string($jenisPameran) && $jenisPameran !== '') {
            $kodePameran = $jenisPameran;
        }

        $date = now()->format('Ymd');
        $prefix = "{$kodePameran}-{$date}-";

        $latest = static::where('kode_pameran_md', 'like', $prefix.'%')
            ->orderByDesc('kode_pameran_md')
            ->value('kode_pameran_md');

        if (! $latest) {
            return $prefix.'0001';
        }

        $sequence = (int) substr($latest, strlen($prefix)) + 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'mulai_tanggal_sewa' => 'date:Y-m-d',
            'tanggal_sewa_berakhir' => 'date:Y-m-d',
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    /**
     * Get the dealer for this exhibition.
     */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /**
     * Get the exhibition type.
     */
    public function jenisPameran(): BelongsTo
    {
        return $this->belongsTo(JenisPameran::class, 'jenis_pameran_id');
    }
}
