<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Type extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_type',
        'category_id',
        'segment_id',
        'nama_pasar',
    ];

    /**
     * Get the category associated with the type.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the segment associated with the type.
     */
    public function segment(): BelongsTo
    {
        return $this->belongsTo(Segment::class);
    }
}
