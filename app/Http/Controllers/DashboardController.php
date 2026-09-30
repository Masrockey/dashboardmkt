<?php

namespace App\Http\Controllers;

use App\Enums\PameranStatus;
use App\Enums\UserRole;
use App\Models\JenisPameran;
use App\Models\Pameran;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request for the dashboard page.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $today = now()->toDateString();

        // Query pameran untuk peta (memiliki latitude dan longitude)
        $mapQuery = Pameran::query()
            ->with(['dealer', 'jenisPameran', 'creator'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');

        // Stats query
        $statsQuery = Pameran::query();

        // Role dealer hanya melihat pameran miliknya
        if ($user->role === UserRole::Dealer) {
            if ($user->dealer_id) {
                $mapQuery->where('dealer_id', $user->dealer_id);
                $statsQuery->where('dealer_id', $user->dealer_id);
            } else {
                $mapQuery->whereRaw('1 = 0');
                $statsQuery->whereRaw('1 = 0');
            }
        }

        $mapPamerans = $mapQuery->latest('id')->get();

        $totalPameran = (clone $statsQuery)->count();

        $berlangsungPameran = (clone $statsQuery)
            ->where('status', '!=', PameranStatus::Ditolak)
            ->where('mulai_tanggal_sewa', '<=', $today)
            ->where('tanggal_sewa_berakhir', '>=', $today)
            ->count();

        $akanDatangPameran = (clone $statsQuery)
            ->where('status', '!=', PameranStatus::Ditolak)
            ->where('mulai_tanggal_sewa', '>', $today)
            ->count();

        $menungguApproval = (clone $statsQuery)
            ->whereIn('status', [PameranStatus::MenungguSpv, PameranStatus::MenungguKabag])
            ->count();

        $disetujuiPameran = (clone $statsQuery)
            ->where('status', PameranStatus::Disetujui)
            ->count();

        $jenisPameranList = JenisPameran::query()
            ->select(['id', 'kode_pameran', 'jenis_pameran', 'icon_map'])
            ->orderBy('jenis_pameran')
            ->get();

        return Inertia::render('dashboard', [
            'mapPamerans' => $mapPamerans,
            'stats' => [
                'total' => $totalPameran,
                'berlangsung' => $berlangsungPameran,
                'akanDatang' => $akanDatangPameran,
                'menungguApproval' => $menungguApproval,
                'disetujui' => $disetujuiPameran,
            ],
            'jenisPameranList' => $jenisPameranList,
        ]);
    }
}
