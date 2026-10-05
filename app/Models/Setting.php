<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->find($key);

        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(
            ['key' => $key],
            ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
        );
    }

    /**
     * Check if the public Meet & Greet registration form is open.
     */
    public static function isMeetAndGreetPublicOpen(): bool
    {
        $value = static::get('meet_and_greet_public_open', '1');

        return in_array($value, ['1', 1, 'true', true], true);
    }

    /**
     * Set the public Meet & Greet registration status.
     */
    public static function setMeetAndGreetPublicOpen(bool $isOpen): void
    {
        static::set('meet_and_greet_public_open', $isOpen ? '1' : '0');
    }
}
