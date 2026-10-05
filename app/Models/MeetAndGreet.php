<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MeetAndGreet extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'no_registrasi',
        'dealer_id',
        'nama_konsumen',
        'alamat',
        'no_hp',
        'tipe_motor',
        'no_plat',
        'stnk_path',
        'created_by_user_id',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (MeetAndGreet $model) {
            if (empty($model->no_registrasi)) {
                $model->no_registrasi = static::generateNoRegistrasi();
            }
        });
    }

    /**
     * Generate sequential registration number in format: MNG-YYYYMMDD-XXXX.
     */
    public static function generateNoRegistrasi(): string
    {
        $date = now()->format('Ymd');
        $prefix = "MNG-{$date}-";

        $latest = static::where('no_registrasi', 'like', $prefix.'%')
            ->orderByDesc('no_registrasi')
            ->value('no_registrasi');

        if (! $latest) {
            return $prefix.'0001';
        }

        $sequence = (int) substr($latest, strlen($prefix)) + 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'stnk_url',
    ];

    /**
     * Get the public URL for the uploaded STNK file.
     */
    protected function stnkUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->stnk_path) {
                    return null;
                }

                if (str_starts_with($this->stnk_path, 'http://') || str_starts_with($this->stnk_path, 'https://')) {
                    return $this->stnk_path;
                }

                return Storage::disk('public')->url($this->stnk_path);
            },
        );
    }

    /**
     * Get the dealer associated with the Meet & Greet record.
     *
     * @return BelongsTo<Dealer, $this>
     */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /**
     * Get the user who created this Meet & Greet record.
     *
     * @return BelongsTo<User, $this>
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
