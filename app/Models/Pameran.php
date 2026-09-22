<?php

namespace App\Models;

use App\Enums\PameranStatus;
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
        'status',
        'created_by_user_id',
        'spv_approved_by',
        'spv_approved_at',
        'kabag_approved_by',
        'kabag_approved_at',
        'catatan_penolakan',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Pameran $pameran) {
            if (empty($pameran->status)) {
                $pameran->status = PameranStatus::MenungguSpv;
            }

            if (empty($pameran->created_by_user_id) && auth()->check()) {
                $pameran->created_by_user_id = auth()->id();
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
     * Approve exhibition by SPV.
     */
    public function approveBySpv(User $user): bool
    {
        if ($this->status !== PameranStatus::MenungguSpv) {
            return false;
        }

        $this->spv_approved_by = $user->id;
        $this->spv_approved_at = now();
        $this->status = PameranStatus::MenungguKabag;

        return $this->save();
    }

    /**
     * Approve exhibition by Kabag.
     */
    public function approveByKabag(User $user): bool
    {
        if ($this->status !== PameranStatus::MenungguKabag) {
            return false;
        }

        $this->kabag_approved_by = $user->id;
        $this->kabag_approved_at = now();
        $this->status = PameranStatus::Disetujui;

        if (empty($this->kode_pameran_md)) {
            $this->kode_pameran_md = static::generateKodePameranMd($this->jenis_pameran_id);
        }

        return $this->save();
    }

    /**
     * Reject exhibition with optional reason.
     */
    public function reject(User $user, ?string $reason = null): bool
    {
        $this->status = PameranStatus::Ditolak;
        $this->catatan_penolakan = $reason;

        return $this->save();
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
            'status' => PameranStatus::class,
            'spv_approved_at' => 'datetime',
            'kabag_approved_at' => 'datetime',
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

    /**
     * Get the user who created this exhibition.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the SPV who approved this exhibition.
     */
    public function spvApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'spv_approved_by');
    }

    /**
     * Get the Kabag who approved this exhibition.
     */
    public function kabagApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kabag_approved_by');
    }
}
