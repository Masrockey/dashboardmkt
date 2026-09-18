<?php

namespace App\Http\Controllers;

use App\Http\Requests\PameranStoreRequest;
use App\Http\Requests\PameranUpdateRequest;
use App\Models\Dealer;
use App\Models\JenisPameran;
use App\Models\Pameran;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PameranController extends Controller
{
    /**
     * Display a listing of exhibitions.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();
        $dealerFilter = $request->string('dealer_id')->toString();
        $jenisFilter = $request->string('jenis_pameran_id')->toString();

        $pamerans = Pameran::query()
            ->with(['dealer', 'jenisPameran'])
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('kode_pameran_md', 'like', "%{$search}%")
                        ->orWhere('kode_pameran_ahm', 'like', "%{$search}%")
                        ->orWhere('kecamatan', 'like', "%{$search}%")
                        ->orWhere('detail_alamat', 'like', "%{$search}%")
                        ->orWhereHas('dealer', function (Builder $dealerQuery) use ($search) {
                            $dealerQuery->where('kode_dealer', 'like', "%{$search}%")
                                ->orWhere('nama_dealer', 'like', "%{$search}%");
                        })
                        ->orWhereHas('jenisPameran', function (Builder $jenisQuery) use ($search) {
                            $jenisQuery->where('kode_pameran', 'like', "%{$search}%")
                                ->orWhere('jenis_pameran', 'like', "%{$search}%");
                        });
                });
            })
            ->when($dealerFilter !== '', function (Builder $query) use ($dealerFilter) {
                $query->where('dealer_id', $dealerFilter);
            })
            ->when($jenisFilter !== '', function (Builder $query) use ($jenisFilter) {
                $query->where('jenis_pameran_id', $jenisFilter);
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $dealers = Dealer::query()
            ->select(['id', 'kode_dealer', 'nama_dealer'])
            ->orderBy('nama_dealer')
            ->get();

        $jenisPameranList = JenisPameran::query()
            ->select(['id', 'kode_pameran', 'jenis_pameran', 'icon_map'])
            ->orderBy('jenis_pameran')
            ->get();

        return Inertia::render('pameran/index', [
            'pamerans' => $pamerans,
            'dealers' => $dealers,
            'jenisPameranList' => $jenisPameranList,
            'filters' => [
                'search' => $search,
                'dealer_id' => $dealerFilter,
                'jenis_pameran_id' => $jenisFilter,
            ],
        ]);
    }

    /**
     * Store a newly created exhibition in storage.
     */
    public function store(PameranStoreRequest $request): RedirectResponse
    {
        Pameran::create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil ditambahkan.',
        ]);

        return to_route('pameran.index');
    }

    /**
     * Update the specified exhibition in storage.
     */
    public function update(PameranUpdateRequest $request, Pameran $pameran): RedirectResponse
    {
        $pameran->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil diperbarui.',
        ]);

        return to_route('pameran.index');
    }

    /**
     * Remove the specified exhibition from storage.
     */
    public function destroy(Pameran $pameran): RedirectResponse
    {
        $pameran->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil dihapus.',
        ]);

        return to_route('pameran.index');
    }
}
