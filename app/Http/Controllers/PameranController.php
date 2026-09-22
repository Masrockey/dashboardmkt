<?php

namespace App\Http\Controllers;

use App\Enums\PameranStatus;
use App\Enums\UserRole;
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
        $user = $request->user();
        $search = $request->string('search')->toString();
        $dealerFilter = $user->role === UserRole::Dealer
            ? (string) ($user->dealer_id ?? '')
            : $request->string('dealer_id')->toString();
        $jenisFilter = $request->string('jenis_pameran_id')->toString();
        $statusFilter = $request->string('status')->toString();

        $pamerans = Pameran::query()
            ->with(['dealer', 'jenisPameran', 'creator', 'spvApprover', 'kabagApprover'])
            ->when($user->role === UserRole::Dealer, function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('dealer_id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
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
            ->when($statusFilter !== '', function (Builder $query) use ($statusFilter) {
                $query->where('status', $statusFilter);
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $dealers = Dealer::query()
            ->select(['id', 'kode_dealer', 'nama_dealer'])
            ->when($user->role === UserRole::Dealer, function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
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
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Store a newly created exhibition in storage.
     */
    public function store(PameranStoreRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->cannot('create', Pameran::class)) {
            abort(403, 'Akun dealer Anda belum terhubung dengan data Dealer.');
        }

        $data = $request->validated();

        if ($user->role === UserRole::Dealer) {
            $data['dealer_id'] = $user->dealer_id;
        }

        $data['created_by_user_id'] = $user->id;
        $data['status'] = PameranStatus::MenungguSpv;

        Pameran::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil ditambahkan dan menunggu persetujuan SPV.',
        ]);

        return to_route('pameran.index');
    }

    /**
     * Update the specified exhibition in storage.
     */
    public function update(PameranUpdateRequest $request, Pameran $pameran): RedirectResponse
    {
        $user = $request->user();

        if ($user->cannot('update', $pameran)) {
            abort(403, 'Anda tidak memiliki akses untuk mengubah pameran dealer lain.');
        }

        $data = $request->validated();

        if ($user->role === UserRole::Dealer) {
            $data['dealer_id'] = $user->dealer_id;
        }

        $pameran->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil diperbarui.',
        ]);

        return to_route('pameran.index');
    }

    /**
     * Remove the specified exhibition from storage.
     */
    public function destroy(Request $request, Pameran $pameran): RedirectResponse
    {
        $user = $request->user();

        if ($user->cannot('delete', $pameran)) {
            abort(403, 'Anda tidak memiliki akses untuk menghapus pameran dealer lain.');
        }

        $pameran->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil dihapus.',
        ]);

        return to_route('pameran.index');
    }

    /**
     * Approve exhibition by SPV.
     */
    public function approveSpv(Request $request, Pameran $pameran): RedirectResponse
    {
        $user = $request->user();

        if (! in_array($user->role, [UserRole::Spv, UserRole::Superadmin], true)) {
            abort(403, 'Anda tidak memiliki hak akses untuk menyetujui tahap SPV.');
        }

        if ($pameran->status !== PameranStatus::MenungguSpv) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Status pameran tidak valid untuk disetujui SPV.',
            ]);

            return back();
        }

        $pameran->approveBySpv($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran berhasil disetujui oleh SPV dan dilanjutkan ke Kabag.',
        ]);

        return back();
    }

    /**
     * Approve exhibition by Kabag.
     */
    public function approveKabag(Request $request, Pameran $pameran): RedirectResponse
    {
        $user = $request->user();

        if (! in_array($user->role, [UserRole::Kabag, UserRole::Superadmin], true)) {
            abort(403, 'Anda tidak memiliki hak akses untuk menyetujui tahap Kabag.');
        }

        if ($pameran->status !== PameranStatus::MenungguKabag) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Status pameran tidak valid untuk disetujui Kabag.',
            ]);

            return back();
        }

        $pameran->approveByKabag($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pameran berhasil disetujui oleh Kabag. Kode Pameran MD ({$pameran->kode_pameran_md}) telah diterbitkan.",
        ]);

        return back();
    }

    /**
     * Reject exhibition with optional reason.
     */
    public function reject(Request $request, Pameran $pameran): RedirectResponse
    {
        $user = $request->user();

        if (! in_array($user->role, [UserRole::Spv, UserRole::Kabag, UserRole::Superadmin], true)) {
            abort(403, 'Anda tidak memiliki hak akses untuk menolak pameran.');
        }

        $validated = $request->validate([
            'catatan_penolakan' => ['nullable', 'string', 'max:1000'],
        ]);

        $pameran->reject($user, $validated['catatan_penolakan'] ?? null);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pameran telah ditolak.',
        ]);

        return back();
    }
}
