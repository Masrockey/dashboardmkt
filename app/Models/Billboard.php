<?php

namespace App\Models;

use App\Enums\BillboardLampStatus;
use App\Enums\BillboardPhysicalStatus;
use Database\Factories\BillboardFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Billboard extends Model
{
    /** @use HasFactory<BillboardFactory> */
    use HasFactory;

    /**
     * Evidence photo columns.
     *
     * @var list<string>
     */
    public const PHOTO_FIELDS = [
        'foto_siang',
        'foto_malam',
        'foto_jarak_jauh',
        'foto_jarak_dekat',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'lokasi',
        'latitude',
        'longitude',
        'ukuran',
        'tanggal_pasang',
        'tanggal_berakhir',
        'status_lampu',
        'status_fisik',
        'foto_siang',
        'foto_malam',
        'foto_jarak_jauh',
        'foto_jarak_dekat',
        'created_by_user_id',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'foto_siang_url',
        'foto_malam_url',
        'foto_jarak_jauh_url',
        'foto_jarak_dekat_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'tanggal_pasang' => 'date:Y-m-d',
            'tanggal_berakhir' => 'date:Y-m-d',
            'status_lampu' => BillboardLampStatus::class,
            'status_fisik' => BillboardPhysicalStatus::class,
        ];
    }

    /**
     * Delete all stored evidence photos for this billboard.
     */
    public function deletePhotos(): void
    {
        foreach (self::PHOTO_FIELDS as $field) {
            self::deleteStoredFile($this->{$field});
        }
    }

    /**
     * Delete a stored file from the public disk if it exists.
     */
    public static function deleteStoredFile(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Get the user who created this billboard.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    protected function fotoSiangUrl(): Attribute
    {
        return Attribute::make(get: fn () => $this->photoUrl($this->foto_siang));
    }

    protected function fotoMalamUrl(): Attribute
    {
        return Attribute::make(get: fn () => $this->photoUrl($this->foto_malam));
    }

    protected function fotoJarakJauhUrl(): Attribute
    {
        return Attribute::make(get: fn () => $this->photoUrl($this->foto_jarak_jauh));
    }

    protected function fotoJarakDekatUrl(): Attribute
    {
        return Attribute::make(get: fn () => $this->photoUrl($this->foto_jarak_dekat));
    }

    /**
     * Resolve the public URL of a stored photo.
     */
    private function photoUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return Storage::disk('public')->url($path);
    }
}
