<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string|null $username
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property UserRole $role
 * @property array<string> $roles
 * @property int|null $dealer_id
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'username', 'email', 'password', 'role', 'roles', 'dealer_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $appends = ['roles'];

    /**
     * Get the dealer associated with the user.
     */
    public function dealer(): BelongsTo
    {
        return $this->belongsTo(Dealer::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => UserRole::class,
            'roles' => 'array',
        ];
    }

    /**
     * Get array of role strings assigned to the user.
     *
     * @return array<string>
     */
    public function getRolesAttribute(): array
    {
        $raw = $this->attributes['roles'] ?? null;
        if (! empty($raw)) {
            $decoded = is_string($raw) ? json_decode($raw, true) : $raw;
            if (is_array($decoded) && count($decoded) > 0) {
                return array_values(array_unique(array_map('strval', $decoded)));
            }
        }

        if (! empty($this->attributes['role'])) {
            $val = $this->attributes['role'] instanceof UserRole
                ? $this->attributes['role']->value
                : (string) $this->attributes['role'];

            return [$val];
        }

        return [UserRole::Dealer->value];
    }

    /**
     * Set array of role strings.
     */
    public function setRolesAttribute($value): void
    {
        if (is_string($value)) {
            $value = json_decode($value, true) ?: [$value];
        }

        if (! is_array($value)) {
            $value = [$value];
        }

        $clean = array_values(array_unique(array_filter(array_map(function ($r) {
            return $r instanceof UserRole ? $r->value : (string) $r;
        }, $value))));

        if (empty($clean)) {
            $clean = [UserRole::Dealer->value];
        }

        $this->attributes['roles'] = json_encode($clean);
        $this->attributes['role'] = $clean[0];
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(UserRole|string $role): bool
    {
        $target = $role instanceof UserRole ? $role->value : $role;

        return in_array($target, $this->roles, true);
    }

    /**
     * Check if user has any of the specified roles.
     *
     * @param array<UserRole|string> $roles
     */
    public function hasAnyRole(array $roles): bool
    {
        foreach ($roles as $role) {
            if ($this->hasRole($role)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user is strictly a dealer without admin/spv/kabag roles.
     */
    public function isDealerOnly(): bool
    {
        return $this->hasRole(UserRole::Dealer) &&
            ! $this->hasAnyRole([UserRole::Superadmin, UserRole::Spv, UserRole::Kabag]);
    }
}
