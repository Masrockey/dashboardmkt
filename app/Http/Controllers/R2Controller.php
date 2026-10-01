<?php

namespace App\Http\Controllers;

use App\Http\Requests\R2ImportRequest;
use App\Http\Requests\R2StoreRequest;
use App\Http\Requests\R2UpdateRequest;
use App\Models\Brand;
use App\Models\Kabupaten;
use App\Models\R2;
use App\Models\Segment;
use App\Models\Type;
use App\Services\R2ImportService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class R2Controller extends Controller
{
    /**
     * Display a listing of R2 records.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $r2s = R2::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('knd_nopol', 'like', "%{$search}%")
                        ->orWhere('knd_nama', 'like', "%{$search}%")
                        ->orWhere('kab_desc', 'like', "%{$search}%")
                        ->orWhere('mrk_desc', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhere('segment', 'like', "%{$search}%")
                        ->orWhere('nama_pasar', 'like', "%{$search}%")
                        ->orWhere('pkb_desc', 'like', "%{$search}%")
                        ->orWhere('model', 'like', "%{$search}%")
                        ->orWhere('kec_desc', 'like', "%{$search}%")
                        ->orWhere('kel_desc', 'like', "%{$search}%")
                        ->orWhere('knd_rangka', 'like', "%{$search}%")
                        ->orWhere('knd_mesin', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('r2/index', [
            'r2s' => $r2s,
            'filters' => [
                'search' => $search,
            ],
            'masterData' => [
                'kabupatens' => Kabupaten::orderBy('nama_kabupaten')->pluck('nama_kabupaten'),
                'brands' => Brand::orderBy('nama_brand')->pluck('nama_brand'),
                'segments' => Segment::orderBy('nama_segment')->pluck('nama_segment'),
                'types' => Type::with('segment')->orderBy('nama_type')->get(['id', 'nama_type', 'segment_id', 'nama_pasar']),
            ],
        ]);
    }

    /**
     * Store a newly created R2 record in storage.
     */
    public function store(R2StoreRequest $request, R2ImportService $importService): RedirectResponse
    {
        $data = $request->validated();
        $importService->adjustRecord($data);

        R2::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data R2 berhasil ditambahkan.',
        ]);

        return to_route('r2.index');
    }

    /**
     * Update the specified R2 record in storage.
     */
    public function update(R2UpdateRequest $request, R2 $r2, R2ImportService $importService): RedirectResponse
    {
        $data = $request->validated();
        $importService->adjustRecord($data);

        $r2->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data R2 berhasil diperbarui.',
        ]);

        return to_route('r2.index');
    }

    /**
     * Import R2 records from uploaded Excel file.
     */
    public function import(R2ImportRequest $request, R2ImportService $importService): RedirectResponse
    {
        $count = $importService->import($request->file('file'));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Berhasil mengimpor {$count} data R2 dari file Excel.",
        ]);

        return to_route('r2.index');
    }

    /**
     * Remove the specified R2 record from storage.
     */
    public function destroy(R2 $r2): RedirectResponse
    {
        $r2->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data R2 berhasil dihapus.',
        ]);

        return to_route('r2.index');
    }
}
