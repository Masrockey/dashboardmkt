<?php

namespace App\Http\Controllers;

use App\Http\Requests\KabupatenStoreRequest;
use App\Http\Requests\KabupatenUpdateRequest;
use App\Models\Kabupaten;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KabupatenController extends Controller
{
    /**
     * Display a listing of kabupatens.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $kabupatens = Kabupaten::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where('nama_kabupaten', 'like', "%{$search}%");
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('kabupaten/index', [
            'kabupatens' => $kabupatens,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created kabupaten in storage.
     */
    public function store(KabupatenStoreRequest $request): RedirectResponse
    {
        Kabupaten::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kabupaten berhasil ditambahkan.',
        ]);

        return to_route('kabupatens.index');
    }

    /**
     * Update the specified kabupaten in storage.
     */
    public function update(KabupatenUpdateRequest $request, Kabupaten $kabupaten): RedirectResponse
    {
        $kabupaten->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kabupaten berhasil diperbarui.',
        ]);

        return to_route('kabupatens.index');
    }

    /**
     * Remove the specified kabupaten from storage.
     */
    public function destroy(Kabupaten $kabupaten): RedirectResponse
    {
        $kabupaten->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kabupaten berhasil dihapus.',
        ]);

        return to_route('kabupatens.index');
    }
}
