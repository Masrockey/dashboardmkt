<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypeStoreRequest;
use App\Http\Requests\TypeUpdateRequest;
use App\Models\Segment;
use App\Models\Type;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TypeController extends Controller
{
    /**
     * Display a listing of types.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $types = Type::query()
            ->with('segment')
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('nama_type', 'like', "%{$search}%")
                        ->orWhere('nama_pasar', 'like', "%{$search}%")
                        ->orWhereHas('segment', function (Builder $segQuery) use ($search) {
                            $segQuery->where('nama_segment', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $segments = Segment::query()
            ->orderBy('nama_segment')
            ->get(['id', 'nama_segment']);

        return Inertia::render('types/index', [
            'types' => $types,
            'segments' => $segments,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created type in storage.
     */
    public function store(TypeStoreRequest $request): RedirectResponse
    {
        Type::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type berhasil ditambahkan.',
        ]);

        return to_route('types.index');
    }

    /**
     * Update the specified type in storage.
     */
    public function update(TypeUpdateRequest $request, Type $type): RedirectResponse
    {
        $type->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type berhasil diperbarui.',
        ]);

        return to_route('types.index');
    }

    /**
     * Remove the specified type from storage.
     */
    public function destroy(Type $type): RedirectResponse
    {
        $type->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Type berhasil dihapus.',
        ]);

        return to_route('types.index');
    }
}
