<?php

namespace App\Http\Controllers;

use App\Http\Requests\R2StoreRequest;
use App\Http\Requests\R2UpdateRequest;
use App\Models\R2;
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
                        ->orWhere('jns_desc', 'like', "%{$search}%")
                        ->orWhere('knd_rangka', 'like', "%{$search}%")
                        ->orWhere('knd_mesin', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('r2/index', [
            'r2s' => $r2s,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a newly created R2 record in storage.
     */
    public function store(R2StoreRequest $request): RedirectResponse
    {
        R2::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data R2 berhasil ditambahkan.',
        ]);

        return to_route('r2.index');
    }

    /**
     * Update the specified R2 record in storage.
     */
    public function update(R2UpdateRequest $request, R2 $r2): RedirectResponse
    {
        $r2->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data R2 berhasil diperbarui.',
        ]);

        return to_route('r2.index');
    }

    /**
     * Import R2 records from uploaded Excel file.
     */
    public function import(\App\Http\Requests\R2ImportRequest $request, \App\Services\R2ImportService $importService): RedirectResponse
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

