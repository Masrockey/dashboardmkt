<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_kategori',
    ];

    /**
     * Get the brands for the category.
     */
    public function brands(): HasMany
    {
        return $this->hasMany(Brand::class);
    }

    /**
     * Get the types for the category.
     */
    public function types(): HasMany
    {
        return $this->hasMany(Type::class);
    }
}
