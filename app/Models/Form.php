<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'template_key',
        'theme',
        'fields',
        'visibility',
        'status',
        'settings',
    ];

    protected $appends = [
        'share_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'theme' => 'array',
            'fields' => 'array',
            'settings' => 'array',
        ];
    }

    /**
     * The user who created the form.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Responses submitted to this form.
     */
    public function responses(): HasMany
    {
        return $this->hasMany(FormResponse::class);
    }

    /**
     * Full shareable public URL for this form.
     */
    public function getShareUrlAttribute(): string
    {
        return url('/f/'.$this->slug);
    }

    /**
     * Scope to only query published forms.
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
