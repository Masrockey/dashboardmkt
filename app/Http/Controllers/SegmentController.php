<?php

namespace App\Http\Controllers;

use App\Http\Requests\SegmentStoreRequest;
use App\Http\Requests\SegmentUpdateRequest;
use App\Models\Segment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SegmentController extends Controller
{
    /**
     * Display a listing of segments.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $segments = Segment::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where('nama_segment', 'like', "%{$search}%");
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('segments/index', [
            'segments' => $segments,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created segment in storage.
     */
    public function store(SegmentStoreRequest $request): RedirectResponse
    {
        Segment::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Segment berhasil ditambahkan.',
        ]);

        return to_route('segments.index');
    }

    /**
     * Update the specified segment in storage.
     */
    public function update(SegmentUpdateRequest $request, Segment $segment): RedirectResponse
    {
        $segment->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Segment berhasil diperbarui.',
        ]);

        return to_route('segments.index');
    }

    /**
     * Remove the specified segment from storage.
     */
    public function destroy(Segment $segment): RedirectResponse
    {
        $segment->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Segment berhasil dihapus.',
        ]);

        return to_route('segments.index');
    }
}
