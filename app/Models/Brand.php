<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Brand extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_brand',
        'category_id',
    ];

    /**
     * Get the category that owns the brand.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
