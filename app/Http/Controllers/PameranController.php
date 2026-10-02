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

        $parseFilter = function (string $key) use ($request): array {
            $raw = $request->input($key);
            if (is_array($raw)) {
                return array_values(array_filter(array_map('strval', $raw), fn ($v) => trim($v) !== ''));
            }
            if (is_string($raw) && trim($raw) !== '') {
                return array_values(array_filter(array_map('trim', explode(',', $raw)), fn ($v) => $v !== ''));
            }

            return [];
        };

        $dealerFilter = $user->isDealerOnly()
            ? ($user->dealer_id ? [(string) $user->dealer_id] : [])
            : $parseFilter('dealer_id');
        $jenisFilter = $parseFilter('jenis_pameran_id');
        $statusFilter = $parseFilter('status');
        $kabupatenFilter = $parseFilter('kabupaten');
        $kecamatanFilter = $parseFilter('kecamatan');

        $pamerans = Pameran::query()
            ->with(['dealer', 'jenisPameran', 'creator', 'spvApprover', 'kabagApprover'])
            ->when($user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('dealer_id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->when($user->hasRole(UserRole::Kabag) && ! $user->hasRole(UserRole::Superadmin), function (Builder $query) {
                $query->where('status', '!=', PameranStatus::MenungguSpv)
                    ->where(function (Builder $sub) {
                        $sub->where('status', '!=', PameranStatus::Ditolak)
                            ->orWhereNotNull('spv_approved_by')
                            ->orWhereNotNull('spv_approved_at');
                    });
            })
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery->where('kode_pameran_md', 'like', "%{$search}%")
                        ->orWhere('kode_pameran_ahm', 'like', "%{$search}%")
                        ->orWhere('kabupaten', 'like', "%{$search}%")
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
            ->when(! empty($dealerFilter), function (Builder $query) use ($dealerFilter) {
                $query->whereIn('dealer_id', $dealerFilter);
            })
            ->when(! empty($jenisFilter), function (Builder $query) use ($jenisFilter) {
                $query->whereIn('jenis_pameran_id', $jenisFilter);
            })
            ->when(! empty($statusFilter), function (Builder $query) use ($statusFilter) {
                $query->whereIn('status', $statusFilter);
            })
            ->when(! empty($kabupatenFilter), function (Builder $query) use ($kabupatenFilter) {
                $query->whereIn('kabupaten', $kabupatenFilter);
            })
            ->when(! empty($kecamatanFilter), function (Builder $query) use ($kecamatanFilter) {
                $query->whereIn('kecamatan', $kecamatanFilter);
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString();

        $dealers = Dealer::query()
            ->select(['id', 'kode_dealer', 'nama_dealer'])
            ->when($user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->orderBy('nama_dealer')
            ->get();

        $jenisPameranList = JenisPameran::query()
            ->select(['id', 'kode_pameran', 'jenis_pameran', 'icon_map', 'radius_km'])
            ->orderBy('jenis_pameran')
            ->get();

        $kabupatenList = Pameran::query()
            ->whereNotNull('kabupaten')
            ->where('kabupaten', '!=', '')
            ->distinct()
            ->pluck('kabupaten')
            ->sort()
            ->values();

        $kecamatanList = Pameran::query()
            ->whereNotNull('kecamatan')
            ->where('kecamatan', '!=', '')
            ->distinct()
            ->pluck('kecamatan')
            ->sort()
            ->values();

        $mapPamerans = Pameran::query()
            ->with([
                'dealer:id,kode_dealer,nama_dealer',
                'jenisPameran:id,kode_pameran,jenis_pameran,icon_map,radius_km',
            ])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->latest('id')
            ->get();

        if ($user->isDealerOnly()) {
            $mapPamerans = $mapPamerans->map(function (Pameran $pameran) use ($user) {
                if ($pameran->dealer_id !== $user->dealer_id) {
                    $masked = new Pameran;
                    $masked->id = $pameran->id;
                    $masked->latitude = $pameran->latitude;
                    $masked->longitude = $pameran->longitude;
                    $masked->jenis_pameran_id = $pameran->jenis_pameran_id;
                    $masked->setRelation('jenisPameran', $pameran->jenisPameran);
                    $masked->setAttribute('is_other_dealer', true);

                    return $masked;
                }

                $pameran->setAttribute('is_other_dealer', false);

                return $pameran;
            });
        }

        return Inertia::render('pameran/index', [
            'pamerans' => $pamerans,
            'mapPamerans' => $mapPamerans,
            'dealers' => $dealers,
            'jenisPameranList' => $jenisPameranList,
            'kabupatenList' => $kabupatenList,
            'kecamatanList' => $kecamatanList,
            'filters' => [
                'search' => $search,
                'dealer_id' => $dealerFilter,
                'jenis_pameran_id' => $jenisFilter,
                'status' => $statusFilter,
                'kabupaten' => $kabupatenFilter,
                'kecamatan' => $kecamatanFilter,
            ],
        ]);
    }

    /**
     * Show the form for creating a new exhibition.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        $dealers = Dealer::query()
            ->select(['id', 'kode_dealer', 'nama_dealer'])
            ->when($user->isDealerOnly(), function (Builder $query) use ($user) {
                if ($user->dealer_id) {
                    $query->where('id', $user->dealer_id);
                } else {
                    $query->whereRaw('1 = 0');
                }
            })
            ->orderBy('nama_dealer')
            ->get();

        $jenisPameranList = JenisPameran::query()
            ->select(['id', 'kode_pameran', 'jenis_pameran', 'icon_map', 'radius_km'])
            ->orderBy('jenis_pameran')
            ->get();

        $existingPamerans = Pameran::query()
            ->with([
                'dealer:id,kode_dealer,nama_dealer',
                'jenisPameran:id,kode_pameran,jenis_pameran,icon_map,radius_km',
            ])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->latest('id')
            ->get();

        if ($user->isDealerOnly()) {
            $existingPamerans = $existingPamerans->map(function (Pameran $pameran) use ($user) {
                if ($pameran->dealer_id !== $user->dealer_id) {
                    $masked = new Pameran;
                    $masked->id = $pameran->id;
                    $masked->latitude = $pameran->latitude;
                    $masked->longitude = $pameran->longitude;
                    $masked->jenis_pameran_id = $pameran->jenis_pameran_id;
                    $masked->setRelation('jenisPameran', $pameran->jenisPameran);
                    $masked->setAttribute('is_other_dealer', true);

                    return $masked;
                }

                $pameran->setAttribute('is_other_dealer', false);

                return $pameran;
            });
        }

        return Inertia::render('pameran/create', [
            'dealers' => $dealers,
            'jenisPameranList' => $jenisPameranList,
            'existingPamerans' => $existingPamerans,
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

        if ($user->isDealerOnly()) {
            $data['dealer_id'] = $user->dealer_id;
            $data['kode_pameran_ahm'] = null;
        }

        $data['created_by_user_id'] = $user->id;
        $data['status'] = PameranStatus::MenungguSpv;

        Pameran::create($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Channel berhasil ditambahkan dan menunggu persetujuan SPV.',
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
            abort(403, 'Anda tidak memiliki akses untuk mengubah channel dealer lain.');
        }

        $data = $request->validated();

        if ($user->role === UserRole::Dealer) {
            $data['dealer_id'] = $user->dealer_id;
            unset($data['kode_pameran_ahm']);
        }

        $pameran->update($data);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Channel berhasil diperbarui.',
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
            abort(403, 'Anda tidak memiliki akses untuk menghapus channel dealer lain.');
        }

        $pameran->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Channel berhasil dihapus.',
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
                'message' => 'Status channel tidak valid untuk disetujui SPV.',
            ]);

            return back();
        }

        $pameran->approveBySpv($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Channel berhasil disetujui oleh SPV dan dilanjutkan ke Kabag.',
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
                'message' => 'Status channel tidak valid untuk disetujui Kabag.',
            ]);

            return back();
        }

        $pameran->approveByKabag($user);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Channel berhasil disetujui oleh Kabag. Kode Channel MD ({$pameran->kode_pameran_md}) telah diterbitkan.",
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
            abort(403, 'Anda tidak memiliki hak akses untuk menolak channel.');
        }

        if ($user->role === UserRole::Kabag && $pameran->status === PameranStatus::MenungguSpv) {
            abort(403, 'Channel belum disetujui oleh SPV.');
        }

        if ($user->role === UserRole::Spv && $pameran->status !== PameranStatus::MenungguSpv) {
            abort(403, 'SPV hanya dapat menolak channel pada tahap menunggu persetujuan SPV.');
        }

        $validated = $request->validate([
            'catatan_penolakan' => ['nullable', 'string', 'max:1000'],
        ]);

        $pameran->reject($user, $validated['catatan_penolakan'] ?? null);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Channel telah ditolak.',
        ]);

        return back();
    }
}
