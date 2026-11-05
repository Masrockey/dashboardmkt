<?php

namespace App\Http\Controllers;

use App\Http\Requests\SeriesStoreRequest;
use App\Http\Requests\SeriesUpdateRequest;
use App\Models\Series;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeriesController extends Controller
{
    /**
     * Display a listing of the series.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $series = Series::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('nama', 'like', "%{$search}%")
                        ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('series/index', [
            'series' => $series,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created series in storage.
     */
    public function store(SeriesStoreRequest $request): RedirectResponse
    {
        Series::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Series berhasil ditambahkan.',
        ]);

        return to_route('series.index');
    }

    /**
     * Update the specified series in storage.
     */
    public function update(SeriesUpdateRequest $request, Series $series): RedirectResponse
    {
        $series->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Series berhasil diperbarui.',
        ]);

        return to_route('series.index');
    }

    /**
     * Remove the specified series from storage.
     */
    public function destroy(Series $series): RedirectResponse
    {
        $series->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Series berhasil dihapus.',
        ]);

        return to_route('series.index');
    }
}
