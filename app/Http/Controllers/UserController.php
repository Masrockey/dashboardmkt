<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $roleFilter = $request->string('role')->toString();

        $users = User::query()
            ->with('dealer')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('dealer', function (Builder $dealerQuery) use ($search) {
                            $dealerQuery->where('kode_dealer', 'like', "%{$search}%")
                                ->orWhere('nama_dealer', 'like', "%{$search}%");
                        });
                });
            })
            ->when($roleFilter !== '', function (Builder $query) use ($roleFilter) {
                $query->where(function (Builder $subQuery) use ($roleFilter) {
                    $subQuery->whereJsonContains('roles', $roleFilter)
                        ->orWhere('role', $roleFilter);
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $dealers = Dealer::query()
            ->select(['id', 'kode_dealer', 'nama_dealer'])
            ->orderBy('nama_dealer')
            ->get();

        $roles = array_map(fn (UserRole $role) => [
            'value' => $role->value,
            'label' => $role->label(),
        ], UserRole::cases());

        return Inertia::render('users/index', [
            'users' => $users,
            'dealers' => $dealers,
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
        ]);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(UserStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['password'] = Hash::make($validated['password']);

        if (! isset($validated['roles']) && isset($validated['role'])) {
            $validated['roles'] = [$validated['role']];
        }

        User::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User berhasil ditambahkan.',
        ]);

        return to_route('users.index');
    }

    /**
     * Update the specified user in storage.
     */
    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        if (! isset($validated['roles']) && isset($validated['role'])) {
            $validated['roles'] = [$validated['role']];
        }

        $user->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User berhasil diperbarui.',
        ]);

        return to_route('users.index');
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()?->id) {
            abort(403, 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'User berhasil dihapus.',
        ]);

        return to_route('users.index');
    }
}
