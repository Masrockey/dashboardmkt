<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'server_url',
    'device_id',
    'auth_username',
    'auth_password',
    'webhook_url',
    'webhook_secret',
    'auto_reconnect',
    'target_group_jid',
    'target_group_name',
])]
class WaServerSetting extends Model
{
    use HasFactory;

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'auto_reconnect' => 'boolean',
    ];

    /**
     * Get the singleton active WA Server setting record.
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'server_url' => config('whatsapp.server_url', 'https://waserver.geofani.biz.id'),
            'device_id' => config('whatsapp.device_id', 'rentcars_main'),
            'auth_username' => config('whatsapp.auth_user', 'admin'),
            'auth_password' => config('whatsapp.auth_pass', 'Jomblo123@'),
            'webhook_url' => null,
            'webhook_secret' => null,
            'auto_reconnect' => true,
            'target_group_jid' => config('whatsapp.target_group_jid', '120363432126043755@g.us'),
            'target_group_name' => config('whatsapp.target_group_name', 'Test grup'),
        ]);
    }
}
