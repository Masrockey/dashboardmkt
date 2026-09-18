<?php

namespace App\Models;

use Database\Factories\JenisPameranFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class JenisPameran extends Model
{
    /** @use HasFactory<JenisPameranFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode_pameran',
        'jenis_pameran',
        'icon_map',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'icon_map_url',
    ];

    /**
     * Get the full URL for icon_map.
     */
    protected function iconMapUrl(): Attribute
    {
        return Attribute::make(
            get: function () {
                if (! $this->icon_map) {
                    return null;
                }

                if (str_starts_with($this->icon_map, 'http://') || str_starts_with($this->icon_map, 'https://')) {
                    return $this->icon_map;
                }

                return Storage::disk('public')->url($this->icon_map);
            },
        );
    }

    /**
     * Get the exhibitions associated with the exhibition type.
     *
     * @return HasMany<Pameran, $this>
     */
    public function pamerans(): HasMany
    {
        return $this->hasMany(Pameran::class, 'jenis_pameran_id');
    }
}
