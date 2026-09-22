<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Pameran;
use App\Models\User;

class PameranPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pameran $pameran): bool
    {
        if ($user->role === UserRole::Dealer) {
            return $user->dealer_id !== null && $pameran->dealer_id === $user->dealer_id;
        }

        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        if ($user->role === UserRole::Dealer) {
            return $user->dealer_id !== null;
        }

        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Pameran $pameran): bool
    {
        if ($user->role === UserRole::Dealer) {
            return $user->dealer_id !== null && $pameran->dealer_id === $user->dealer_id;
        }

        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pameran $pameran): bool
    {
        if ($user->role === UserRole::Dealer) {
            return $user->dealer_id !== null && $pameran->dealer_id === $user->dealer_id;
        }

        return true;
    }

    /**
     * Determine whether the user can approve at the SPV stage.
     */
    public function approveSpv(User $user, Pameran $pameran): bool
    {
        return in_array($user->role, [UserRole::Spv, UserRole::Superadmin], true);
    }

    /**
     * Determine whether the user can approve at the Kabag stage.
     */
    public function approveKabag(User $user, Pameran $pameran): bool
    {
        return in_array($user->role, [UserRole::Kabag, UserRole::Superadmin], true);
    }

    /**
     * Determine whether the user can reject the model.
     */
    public function reject(User $user, Pameran $pameran): bool
    {
        return in_array($user->role, [UserRole::Spv, UserRole::Kabag, UserRole::Superadmin], true);
    }
}
