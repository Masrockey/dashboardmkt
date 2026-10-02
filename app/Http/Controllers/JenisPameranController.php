<?php

namespace App\Http\Controllers;

use App\Http\Requests\JenisPameranStoreRequest;
use App\Http\Requests\JenisPameranUpdateRequest;
use App\Models\JenisPameran;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class JenisPameranController extends Controller
{
    /**
     * Display a listing of exhibition types.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $jenisPameran = JenisPameran::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('kode_pameran', 'like', "%{$search}%")
                        ->orWhere('jenis_pameran', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('jenis-pameran/index', [
            'jenisPameran' => $jenisPameran,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created exhibition type in storage.
     */
    public function store(JenisPameranStoreRequest $request): RedirectResponse
    {
        $data = $request->safe()->only(['kode_pameran', 'jenis_pameran', 'radius_km']);

        if ($request->hasFile('icon_map')) {
            $data['icon_map'] = $request->file('icon_map')->store('icons/pameran', 'public');
        } else {
            $data['icon_map'] = null;
        }

        JenisPameran::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jenis pameran berhasil ditambahkan.',
        ]);

        return to_route('jenis-pameran.index');
    }

    /**
     * Update the specified exhibition type in storage.
     */
    public function update(JenisPameranUpdateRequest $request, JenisPameran $jenisPameran): RedirectResponse
    {
        $data = $request->safe()->only(['kode_pameran', 'jenis_pameran', 'radius_km']);

        if ($request->boolean('remove_icon_map')) {
            if ($jenisPameran->icon_map && Storage::disk('public')->exists($jenisPameran->icon_map)) {
                Storage::disk('public')->delete($jenisPameran->icon_map);
            }

            $data['icon_map'] = null;
        } elseif ($request->hasFile('icon_map')) {
            if ($jenisPameran->icon_map && Storage::disk('public')->exists($jenisPameran->icon_map)) {
                Storage::disk('public')->delete($jenisPameran->icon_map);
            }

            $data['icon_map'] = $request->file('icon_map')->store('icons/pameran', 'public');
        }

        $jenisPameran->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jenis pameran berhasil diperbarui.',
        ]);

        return to_route('jenis-pameran.index');
    }

    /**
     * Remove the specified exhibition type from storage.
     */
    public function destroy(JenisPameran $jenisPameran): RedirectResponse
    {
        if ($jenisPameran->icon_map && Storage::disk('public')->exists($jenisPameran->icon_map)) {
            Storage::disk('public')->delete($jenisPameran->icon_map);
        }

        $jenisPameran->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jenis pameran berhasil dihapus.',
        ]);

        return to_route('jenis-pameran.index');
    }
}
