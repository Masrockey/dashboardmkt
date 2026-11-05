<?php

namespace App\Http\Controllers;

use App\Http\Requests\TypeImportRequest;
use App\Http\Requests\TypeStoreRequest;
use App\Http\Requests\TypeUpdateRequest;
use App\Models\Category;
use App\Models\Segment;
use App\Models\Series;
use App\Models\Type;
use App\Services\TypeExcelService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TypeController extends Controller
{
    /**
     * Display a listing of types.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $types = Type::query()
            ->with(['segment', 'category', 'series'])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('nama_type', 'like', "%{$search}%")
                        ->orWhere('nama_pasar', 'like', "%{$search}%")
                        ->orWhereHas('segment', function (Builder $segQuery) use ($search) {
                            $segQuery->where('nama_segment', 'like', "%{$search}%");
                        })
                        ->orWhereHas('category', function (Builder $catQuery) use ($search) {
                            $catQuery->where('nama_kategori', 'like', "%{$search}%");
                        })
                        ->orWhereHas('series', function (Builder $serQuery) use ($search) {
                            $serQuery->where('nama', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $segments = Segment::query()
            ->orderBy('nama_segment')
            ->get(['id', 'nama_segment']);

        $categories = Category::query()
            ->orderBy('nama_kategori')
            ->get(['id', 'nama_kategori']);

        $allSeries = Series::query()
            ->orderBy('nama')
            ->get(['id', 'nama']);

        return Inertia::render('types/index', [
            'types' => $types,
            'segments' => $segments,
            'categories' => $categories,
            'allSeries' => $allSeries,
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

    /**
     * Export master types to an Excel file.
     */
    public function export(Request $request, TypeExcelService $excelService): StreamedResponse
    {
        $search = $request->string('search')->toString();

        return $excelService->export($search !== '' ? $search : null);
    }

    /**
     * Download template Excel for importing master types.
     */
    public function template(TypeExcelService $excelService): StreamedResponse
    {
        return $excelService->template();
    }

    /**
     * Import master types from uploaded Excel file.
     */
    public function import(TypeImportRequest $request, TypeExcelService $excelService): RedirectResponse
    {
        $count = $excelService->import($request->file('file'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Berhasil mengimpor {$count} data Master Type dari file Excel.",
        ]);

        return to_route('types.index');
    }
}
