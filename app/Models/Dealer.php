<?php

namespace App\Models;

use Database\Factories\DealerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dealer extends Model
{
    /** @use HasFactory<DealerFactory> */
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'kode_dealer',
        'nama_dealer',
    ];

    /**
     * Get the users associated with the dealer.
     *
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the exhibitions associated with the dealer.
     *
     * @return HasMany<Pameran, $this>
     */
    public function pamerans(): HasMany
    {
        return $this->hasMany(Pameran::class);
    }
}
