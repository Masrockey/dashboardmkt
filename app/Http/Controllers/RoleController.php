<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleStoreRequest;
use App\Http\Requests\RoleUpdateRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    /**
     * Ensure the user has permission to manage roles.
     */
    private function authorizeRoleManagement(Request $request): void
    {
        $user = $request->user();
        if (! $user || (! $user->hasRole('superadmin') && ! $user->hasPermission('management.roles'))) {
            abort(403, 'Anda tidak memiliki izin untuk mengelola Role & Hak Akses.');
        }
    }

    /**
     * Display a listing of the roles.
     */
    public function index(Request $request): Response
    {
        $this->authorizeRoleManagement($request);

        $search = $request->string('search')->toString();

        $roles = Role::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('label', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            })
            ->orderBy('id')
            ->get()
            ->map(function (Role $role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                    'label' => $role->label,
                    'description' => $role->description,
                    'permissions' => $role->permissions ?? [],
                    'is_system' => $role->is_system,
                    'users_count' => $role->users_count,
                    'created_at' => $role->created_at?->toISOString(),
                    'updated_at' => $role->updated_at?->toISOString(),
                ];
            });

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'groupedPermissions' => Role::getGroupedPermissions(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(RoleStoreRequest $request): RedirectResponse
    {
        $this->authorizeRoleManagement($request);

        Role::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role baru berhasil ditambahkan.',
        ]);

        return to_route('roles.index')->with('success', 'Role baru berhasil ditambahkan.');
    }

    /**
     * Update the specified role in storage.
     */
    public function update(RoleUpdateRequest $request, Role $role): RedirectResponse
    {
        $this->authorizeRoleManagement($request);

        $role->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role dan hak akses berhasil diperbarui.',
        ]);

        return to_route('roles.index')->with('success', 'Role dan hak akses berhasil diperbarui.');
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $this->authorizeRoleManagement($request);

        if ($role->is_system || $role->name === 'superadmin') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Role sistem tidak dapat dihapus.',
            ]);

            return back()->with('error', 'Role sistem tidak dapat dihapus.');
        }

        $usersCount = $role->users_count;
        if ($usersCount > 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Role {$role->label} sedang digunakan oleh {$usersCount} pengguna. Pindahkan pengguna ke role lain terlebih dahulu.",
            ]);

            return back()->with('error', "Role {$role->label} sedang digunakan oleh {$usersCount} pengguna. Pindahkan pengguna ke role lain terlebih dahulu.");
        }

        $role->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role berhasil dihapus.',
        ]);

        return to_route('roles.index')->with('success', 'Role berhasil dihapus.');
    }
}
