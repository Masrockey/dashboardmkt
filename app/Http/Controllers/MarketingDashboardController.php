<?php

namespace App\Http\Controllers;

use App\Models\R2;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MarketingDashboardController extends Controller
{
    /**
     * Display the marketing dashboard.
     */
    public function index(Request $request): Response
    {
        $kabupaten = $request->string('kabupaten')->toString();
        $brand = $request->string('brand')->toString();
        $year = $request->string('year')->toString();
        $startDate = $request->string('start_date')->toString();
        $endDate = $request->string('end_date')->toString();

        // Base query with filters
        $baseQuery = R2::query()
            ->when($kabupaten !== '' && $kabupaten !== 'all', function (Builder $query) use ($kabupaten) {
                $query->where('kab_desc', $kabupaten);
            })
            ->when($brand !== '' && $brand !== 'all', function (Builder $query) use ($brand) {
                $query->where('mrk_desc', $brand);
            })
            ->when($year !== '' && $year !== 'all', function (Builder $query) use ($year) {
                $query->where('knd_thn_buat', $year);
            })
            ->when($startDate !== '', function (Builder $query) use ($startDate) {
                $query->whereDate('ctk_notice_tanggal', '>=', $startDate);
            })
            ->when($endDate !== '', function (Builder $query) use ($endDate) {
                $query->whereDate('ctk_notice_tanggal', '<=', $endDate);
            });

        $totalUnits = (clone $baseQuery)->count();

        // Honda vs Competitor metrics
        $hondaUnits = (clone $baseQuery)
            ->where(function (Builder $q) {
                $q->where('mrk_desc', 'like', '%HONDA%')
                    ->orWhere('mrk_desc', 'like', '%HND%');
            })
            ->count();

        $competitorUnits = max(0, $totalUnits - $hondaUnits);
        $hondaMarketShare = $totalUnits > 0 ? round(($hondaUnits / $totalUnits) * 100, 1) : 0;
        $competitorMarketShare = $totalUnits > 0 ? round(($competitorUnits / $totalUnits) * 100, 1) : 0;

        // Distinct counts
        $totalKabupaten = (clone $baseQuery)
            ->whereNotNull('kab_desc')
            ->where('kab_desc', '!=', '')
            ->distinct()
            ->count('kab_desc');

        $totalKecamatan = (clone $baseQuery)
            ->whereNotNull('kec_desc')
            ->where('kec_desc', '!=', '')
            ->distinct()
            ->count('kec_desc');

        // Brand Distribution (Market Share)
        $brandDistribution = (clone $baseQuery)
            ->select('mrk_desc as brand', DB::raw('count(*) as count'))
            ->whereNotNull('mrk_desc')
            ->where('mrk_desc', '!=', '')
            ->groupBy('mrk_desc')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(function ($item) use ($totalUnits) {
                $count = (int) $item->count;
                $pct = $totalUnits > 0 ? round(($count / $totalUnits) * 100, 1) : 0;
                $isHonda = str_contains(strtoupper((string) $item->brand), 'HONDA');

                return [
                    'brand' => (string) $item->brand,
                    'count' => $count,
                    'percentage' => $pct,
                    'is_honda' => $isHonda,
                ];
            });

        // Grouped top brands per kabupaten for map statistics
        $kabupatenBrands = (clone $baseQuery)
            ->select('kab_desc', 'mrk_desc', DB::raw('count(*) as count'))
            ->whereNotNull('kab_desc')
            ->where('kab_desc', '!=', '')
            ->whereNotNull('mrk_desc')
            ->where('mrk_desc', '!=', '')
            ->groupBy('kab_desc', 'mrk_desc')
            ->orderByDesc('count')
            ->get()
            ->groupBy('kab_desc');

        // All kecamatans grouped by kabupaten with Honda counts
        $allKecamatans = (clone $baseQuery)
            ->select('kab_desc', 'kec_desc', DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN mrk_desc LIKE '%HONDA%' OR mrk_desc LIKE '%HND%' THEN 1 ELSE 0 END) as honda_count"))
            ->whereNotNull('kab_desc')
            ->where('kab_desc', '!=', '')
            ->whereNotNull('kec_desc')
            ->where('kec_desc', '!=', '')
            ->groupBy('kab_desc', 'kec_desc')
            ->orderByDesc('total')
            ->get()
            ->groupBy('kab_desc');

        // All desas grouped by kabupaten and kecamatan
        $allDesas = (clone $baseQuery)
            ->select('kab_desc', 'kec_desc', 'kel_desc', DB::raw('count(*) as total'), DB::raw("SUM(CASE WHEN mrk_desc LIKE '%HONDA%' OR mrk_desc LIKE '%HND%' THEN 1 ELSE 0 END) as honda_count"))
            ->whereNotNull('kab_desc')
            ->where('kab_desc', '!=', '')
            ->whereNotNull('kec_desc')
            ->where('kec_desc', '!=', '')
            ->whereNotNull('kel_desc')
            ->where('kel_desc', '!=', '')
            ->groupBy('kab_desc', 'kec_desc', 'kel_desc')
            ->orderByDesc('total')
            ->get()
            ->groupBy(function ($item) {
                return $item->kab_desc.'|'.$item->kec_desc;
            });

        // Kabupaten Distribution with Geographic Coordinates, Kecamatans, and Desas for Map Overlay
        $kabupatenDistribution = (clone $baseQuery)
            ->select('kab_desc as kabupaten', DB::raw('count(*) as total'))
            ->whereNotNull('kab_desc')
            ->where('kab_desc', '!=', '')
            ->groupBy('kab_desc')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) use ($baseQuery, $totalUnits, $kabupatenBrands, $allKecamatans, $allDesas) {
                $kabName = (string) $item->kabupaten;
                $total = (int) $item->total;

                $hondaCount = (clone $baseQuery)
                    ->where('kab_desc', $kabName)
                    ->where(function (Builder $q) {
                        $q->where('mrk_desc', 'like', '%HONDA%')
                            ->orWhere('mrk_desc', 'like', '%HND%');
                    })
                    ->count();

                $competitorCount = max(0, $total - $hondaCount);
                $hondaShare = $total > 0 ? round(($hondaCount / $total) * 100, 1) : 0;
                $pctOfTotal = $totalUnits > 0 ? round(($total / $totalUnits) * 100, 1) : 0;
                $coords = $this->getKabupatenCoordinates($kabName);

                $topBrands = ($kabupatenBrands->get($kabName) ?? collect())
                    ->take(3)
                    ->map(function ($b) use ($total) {
                        $bCount = (int) $b->count;

                        return [
                            'brand' => (string) $b->mrk_desc,
                            'count' => $bCount,
                            'percentage' => $total > 0 ? round(($bCount / $total) * 100, 1) : 0,
                            'is_honda' => str_contains(strtoupper((string) $b->mrk_desc), 'HONDA'),
                        ];
                    })
                    ->values()
                    ->all();

                $kecamatansInKab = $allKecamatans->get($kabName) ?? collect();

                $topKec = $kecamatansInKab
                    ->take(3)
                    ->map(function ($k) {
                        return [
                            'kecamatan' => (string) $k->kec_desc,
                            'count' => (int) $k->total,
                        ];
                    })
                    ->values()
                    ->all();

                $fullKecamatanList = $kecamatansInKab
                    ->map(function ($k, $idx) use ($kabName, $coords, $allDesas) {
                        $kecName = (string) $k->kec_desc;
                        $kecTotal = (int) $k->total;
                        $kecHonda = (int) $k->honda_count;
                        $kecCoords = $this->getKecamatanCoordinates($kabName, $kecName, $idx, $coords);

                        $desaKey = $kabName.'|'.$kecName;
                        $desas = ($allDesas->get($desaKey) ?? collect())
                            ->take(12)
                            ->map(function ($d, $dIdx) use ($kecCoords) {
                                $dTotal = (int) $d->total;
                                $dHonda = (int) $d->honda_count;
                                $angle = ($dIdx * 30 + 15) * (M_PI / 180);
                                $radius = 0.009 + (($dIdx % 4) * 0.006);

                                return [
                                    'desa' => (string) $d->kel_desc,
                                    'total' => $dTotal,
                                    'honda_count' => $dHonda,
                                    'competitor_count' => max(0, $dTotal - $dHonda),
                                    'honda_share' => $dTotal > 0 ? round(($dHonda / $dTotal) * 100, 1) : 0,
                                    'latitude' => $kecCoords['lat'] + ($radius * cos($angle)),
                                    'longitude' => $kecCoords['lng'] + ($radius * sin($angle) * 1.15),
                                ];
                            })
                            ->values()
                            ->all();

                        return [
                            'kecamatan' => $kecName,
                            'total' => $kecTotal,
                            'honda_count' => $kecHonda,
                            'competitor_count' => max(0, $kecTotal - $kecHonda),
                            'honda_share' => $kecTotal > 0 ? round(($kecHonda / $kecTotal) * 100, 1) : 0,
                            'latitude' => $kecCoords['lat'],
                            'longitude' => $kecCoords['lng'],
                            'desas' => $desas,
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'kabupaten' => $kabName,
                    'total' => $total,
                    'honda_count' => $hondaCount,
                    'competitor_count' => $competitorCount,
                    'honda_share' => $hondaShare,
                    'percentage_of_total' => $pctOfTotal,
                    'latitude' => $coords['lat'] ?? null,
                    'longitude' => $coords['lng'] ?? null,
                    'capital' => $coords['capital'] ?? null,
                    'top_brands' => $topBrands,
                    'top_kecamatans' => $topKec,
                    'kecamatans' => $fullKecamatanList,
                ];
            });

        // Top 8 Kecamatan Distribution
        $topKecamatan = (clone $baseQuery)
            ->select('kec_desc as kecamatan', 'kab_desc as kabupaten', DB::raw('count(*) as total'))
            ->whereNotNull('kec_desc')
            ->where('kec_desc', '!=', '')
            ->groupBy('kec_desc', 'kab_desc')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(function ($item) use ($baseQuery) {
                $kec = (string) $item->kecamatan;
                $kab = (string) $item->kabupaten;
                $total = (int) $item->total;

                $hondaCount = (clone $baseQuery)
                    ->where('kec_desc', $kec)
                    ->where('kab_desc', $kab)
                    ->where(function (Builder $q) {
                        $q->where('mrk_desc', 'like', '%HONDA%')
                            ->orWhere('mrk_desc', 'like', '%HND%');
                    })
                    ->count();

                return [
                    'kecamatan' => $kec,
                    'kabupaten' => $kab,
                    'total' => $total,
                    'honda_count' => $hondaCount,
                    'honda_share' => $total > 0 ? round(($hondaCount / $total) * 100, 1) : 0,
                ];
            });

        // Cylinder (CC) Capacity Segments
        $cylinderSegments = (clone $baseQuery)
            ->select('knd_cyl')
            ->get()
            ->groupBy(function ($item) {
                $cyl = (int) $item->knd_cyl;
                if ($cyl > 0 && $cyl < 125) {
                    return '< 125 CC (Entry / Matic Kecil)';
                }
                if ($cyl >= 125 && $cyl <= 150) {
                    return '125 - 150 CC (Medium / Vario)';
                }
                if ($cyl > 150 && $cyl <= 200) {
                    return '151 - 200 CC (High / PCX / ADV)';
                }
                if ($cyl > 200) {
                    return '> 200 CC (Premium / Sport)';
                }

                return 'Lainnya / Tidak Tercatat';
            })
            ->map(function ($items, $label) use ($totalUnits) {
                $count = $items->count();

                return [
                    'label' => (string) $label,
                    'count' => $count,
                    'percentage' => $totalUnits > 0 ? round(($count / $totalUnits) * 100, 1) : 0,
                ];
            })
            ->values()
            ->sortByDesc('count')
            ->values();

        // Vehicle Usage (Guna) Breakdown
        $usageDistribution = (clone $baseQuery)
            ->select('guna_desc as guna', DB::raw('count(*) as count'))
            ->whereNotNull('guna_desc')
            ->where('guna_desc', '!=', '')
            ->groupBy('guna_desc')
            ->orderByDesc('count')
            ->get()
            ->map(function ($item) use ($totalUnits) {
                $count = (int) $item->count;

                return [
                    'guna' => (string) $item->guna,
                    'count' => $count,
                    'percentage' => $totalUnits > 0 ? round(($count / $totalUnits) * 100, 1) : 0,
                ];
            });

        // Year of Manufacture Distribution
        $yearDistribution = (clone $baseQuery)
            ->select('knd_thn_buat as year', DB::raw('count(*) as count'))
            ->whereNotNull('knd_thn_buat')
            ->where('knd_thn_buat', '!=', '')
            ->groupBy('knd_thn_buat')
            ->orderByDesc('knd_thn_buat')
            ->limit(7)
            ->get()
            ->map(function ($item) use ($totalUnits) {
                $count = (int) $item->count;

                return [
                    'year' => (string) $item->year,
                    'count' => $count,
                    'percentage' => $totalUnits > 0 ? round(($count / $totalUnits) * 100, 1) : 0,
                ];
            });

        // Recent 6 registrations for preview
        $recentRegistrations = (clone $baseQuery)
            ->select([
                'id',
                'knd_nopol',
                'knd_nama',
                'mrk_desc',
                'pkb_desc',
                'kab_desc',
                'kec_desc',
                'knd_thn_buat',
                'knd_cyl',
                'ctk_notice_tanggal',
            ])
            ->latest('id')
            ->limit(6)
            ->get();

        // Options for Filter Selects
        $filterOptions = [
            'kabupatens' => R2::query()
                ->whereNotNull('kab_desc')
                ->where('kab_desc', '!=', '')
                ->distinct()
                ->orderBy('kab_desc')
                ->pluck('kab_desc'),
            'brands' => R2::query()
                ->whereNotNull('mrk_desc')
                ->where('mrk_desc', '!=', '')
                ->distinct()
                ->orderBy('mrk_desc')
                ->pluck('mrk_desc'),
            'years' => R2::query()
                ->whereNotNull('knd_thn_buat')
                ->where('knd_thn_buat', '!=', '')
                ->distinct()
                ->orderByDesc('knd_thn_buat')
                ->pluck('knd_thn_buat'),
        ];

        return Inertia::render('marketing/dashboard', [
            'stats' => [
                'total_units' => $totalUnits,
                'honda_units' => $hondaUnits,
                'honda_market_share' => $hondaMarketShare,
                'competitor_units' => $competitorUnits,
                'competitor_market_share' => $competitorMarketShare,
                'total_kabupaten' => $totalKabupaten,
                'total_kecamatan' => $totalKecamatan,
            ],
            'brandDistribution' => $brandDistribution,
            'kabupatenDistribution' => $kabupatenDistribution,
            'topKecamatan' => $topKecamatan,
            'cylinderSegments' => $cylinderSegments,
            'usageDistribution' => $usageDistribution,
            'yearDistribution' => $yearDistribution,
            'recentRegistrations' => $recentRegistrations,
            'filterOptions' => $filterOptions,
            'filters' => [
                'kabupaten' => $kabupaten,
                'brand' => $brand,
                'year' => $year,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Geographic center coordinates and administrative capitals for all Kabupatens/Cities in NTB.
     *
     * @var array<string, array{lat: float, lng: float, capital: string}>
     */
    protected const KABUPATEN_COORDINATES = [
        'KOTA MATARAM' => ['lat' => -8.5833, 'lng' => 116.1167, 'capital' => 'Kota Mataram'],
        'KAB. LOMBOK BARAT' => ['lat' => -8.6833, 'lng' => 116.1333, 'capital' => 'Gerung'],
        'KAB. LOMBOK TENGAH' => ['lat' => -8.7000, 'lng' => 116.2800, 'capital' => 'Praya'],
        'KAB. LOMBOK TIMUR' => ['lat' => -8.6500, 'lng' => 116.5333, 'capital' => 'Selong'],
        'KAB. LOMBOK UTARA' => ['lat' => -8.3500, 'lng' => 116.1500, 'capital' => 'Tanjung'],
        'KAB. SUMBAWA BARAT' => ['lat' => -8.7460, 'lng' => 116.8530, 'capital' => 'Taliwang'],
        'KAB. SUMBAWA' => ['lat' => -8.5000, 'lng' => 117.4300, 'capital' => 'Sumbawa Besar'],
        'KAB. DOMPU' => ['lat' => -8.5350, 'lng' => 118.4600, 'capital' => 'Dompu'],
        'KAB. BIMA' => ['lat' => -8.5800, 'lng' => 118.7300, 'capital' => 'Woha'],
        'KOTA BIMA' => ['lat' => -8.4600, 'lng' => 118.7250, 'capital' => 'Kota Bima'],
    ];

    /**
     * Resolve coordinate for a given kabupaten name with resilient fuzzy matching.
     *
     * @return array{lat: float, lng: float, capital: string}|null
     */
    protected function getKabupatenCoordinates(string $kabupatenName): ?array
    {
        $upper = strtoupper(trim($kabupatenName));
        if (isset(self::KABUPATEN_COORDINATES[$upper])) {
            return self::KABUPATEN_COORDINATES[$upper];
        }

        $cleaned = trim(preg_replace('/^(KAB\.?|KOTA)\s+/i', '', $upper));
        foreach (self::KABUPATEN_COORDINATES as $key => $coords) {
            $keyCleaned = trim(preg_replace('/^(KAB\.?|KOTA)\s+/i', '', $key));
            if ($cleaned === $keyCleaned || str_contains($upper, $keyCleaned) || str_contains($key, $cleaned)) {
                return $coords;
            }
        }

        return null;
    }

    /**
     * Geographic center coordinates for Kecamatans in Nusa Tenggara Barat.
     *
     * @var array<string, array{lat: float, lng: float}>
     */
    protected const KECAMATAN_COORDINATES = [
        // Lombok Utara
        'BAYAN' => ['lat' => -8.2700, 'lng' => 116.4250],
        'TANJUNG' => ['lat' => -8.3533, 'lng' => 116.1550],
        'PEMENANG' => ['lat' => -8.4050, 'lng' => 116.1010],
        'GANGGA' => ['lat' => -8.3300, 'lng' => 116.2000],
        'KAYANGAN' => ['lat' => -8.2520, 'lng' => 116.2750],

        // Kota Mataram
        'AMPENAN' => ['lat' => -8.5750, 'lng' => 116.0780],
        'SEKARBELA' => ['lat' => -8.6050, 'lng' => 116.0880],
        'MATARAM' => ['lat' => -8.5833, 'lng' => 116.1050],
        'SELAPARANG' => ['lat' => -8.5670, 'lng' => 116.1150],
        'CAKRANEGARA' => ['lat' => -8.5900, 'lng' => 116.1320],
        'SANDUBAYA' => ['lat' => -8.6020, 'lng' => 116.1580],

        // Lombok Barat
        'GERUNG' => ['lat' => -8.6833, 'lng' => 116.1333],
        'KEDIRI' => ['lat' => -8.6500, 'lng' => 116.1600],
        'KURIPAN' => ['lat' => -8.6850, 'lng' => 116.1750],
        'LABUAPI' => ['lat' => -8.6300, 'lng' => 116.1100],
        'NARMADA' => ['lat' => -8.5850, 'lng' => 116.2100],
        'LINGSAR' => ['lat' => -8.5500, 'lng' => 116.1850],
        'GUNUNG SARI' => ['lat' => -8.5250, 'lng' => 116.1100],
        'BATU LAYAR' => ['lat' => -8.4900, 'lng' => 116.0750],
        'LEMBAR' => ['lat' => -8.7300, 'lng' => 116.0700],
        'SEKOTONG' => ['lat' => -8.7500, 'lng' => 115.9800],

        // Lombok Tengah
        'PRAYA' => ['lat' => -8.7000, 'lng' => 116.2800],
        'PRAYA KOTA' => ['lat' => -8.7000, 'lng' => 116.2800],
        'PRAYA TENGAH' => ['lat' => -8.6950, 'lng' => 116.3150],
        'PRAYA TIMUR' => ['lat' => -8.7100, 'lng' => 116.3700],
        'PRAYA BARAT' => ['lat' => -8.7500, 'lng' => 116.2000],
        'PRAYA BRT DAYA' => ['lat' => -8.7800, 'lng' => 116.1600],
        'PRAYA BARAT DAYA' => ['lat' => -8.7800, 'lng' => 116.1600],
        'PUJUT' => ['lat' => -8.8200, 'lng' => 116.2800],
        'JONGGAT' => ['lat' => -8.6650, 'lng' => 116.2200],
        'PRINGGARATA' => ['lat' => -8.6250, 'lng' => 116.2350],
        'BATUKLIANG' => ['lat' => -8.6300, 'lng' => 116.2900],
        'BATUKLIANG UTARA' => ['lat' => -8.5700, 'lng' => 116.3000],
        'BT. KLIANG UTARA' => ['lat' => -8.5700, 'lng' => 116.3000],
        'KOPANG' => ['lat' => -8.6400, 'lng' => 116.3500],
        'JANAPRIA' => ['lat' => -8.6800, 'lng' => 116.3850],

        // Lombok Timur
        'SELONG' => ['lat' => -8.6500, 'lng' => 116.5333],
        'SUKAMULIA' => ['lat' => -8.6350, 'lng' => 116.5200],
        'LABUAN HAJI' => ['lat' => -8.6600, 'lng' => 116.5750],
        'SURALAGA' => ['lat' => -8.6050, 'lng' => 116.5250],
        'MASBAGIK' => ['lat' => -8.6200, 'lng' => 116.4700],
        'PRINGGASELA' => ['lat' => -8.5800, 'lng' => 116.4850],
        'AIKMEL' => ['lat' => -8.5700, 'lng' => 116.5350],
        'LENEK' => ['lat' => -8.5500, 'lng' => 116.5450],
        'WANASABA' => ['lat' => -8.5400, 'lng' => 116.5300],
        'SEMBALUN' => ['lat' => -8.3600, 'lng' => 116.5250],
        'SWELA' => ['lat' => -8.5000, 'lng' => 116.5700],
        'PRINGGABAYA' => ['lat' => -8.5600, 'lng' => 116.6200],
        'SAMBALIA' => ['lat' => -8.3800, 'lng' => 116.6800],
        'SIKUR' => ['lat' => -8.6400, 'lng' => 116.4400],
        'TERARA' => ['lat' => -8.6450, 'lng' => 116.3950],
        'MONTONG GADING' => ['lat' => -8.6050, 'lng' => 116.3900],
        'SAKRA' => ['lat' => -8.6800, 'lng' => 116.4750],
        'SAKRA BARAT' => ['lat' => -8.6900, 'lng' => 116.4400],
        'SAKRA TIMUR' => ['lat' => -8.6950, 'lng' => 116.5150],
        'KERUAK' => ['lat' => -8.7500, 'lng' => 116.4800],
        'JEROWARU' => ['lat' => -8.8200, 'lng' => 116.4950],

        // Sumbawa Barat
        'TALIWANG' => ['lat' => -8.7460, 'lng' => 116.8530],
        'SETELUK' => ['lat' => -8.6400, 'lng' => 116.8400],
        'POTO TANO' => ['lat' => -8.5500, 'lng' => 116.8200],
        'BRANG REA' => ['lat' => -8.7600, 'lng' => 116.9200],
        'BRANG ENE' => ['lat' => -8.8100, 'lng' => 116.8900],
        'JEREWEH' => ['lat' => -8.8600, 'lng' => 116.8200],
        'MALUK' => ['lat' => -8.9200, 'lng' => 116.7600],
        'SEKONGKANG' => ['lat' => -8.9800, 'lng' => 116.7800],

        // Sumbawa
        'SUMBAWA' => ['lat' => -8.5000, 'lng' => 117.4300],
        'UNTER IWES' => ['lat' => -8.5300, 'lng' => 117.4100],
        'LABUHAN BADAS' => ['lat' => -8.4700, 'lng' => 117.4200],
        'MOYO HILIR' => ['lat' => -8.5000, 'lng' => 117.5200],
        'MOYO UTARA' => ['lat' => -8.4200, 'lng' => 117.5100],
        'MOYO HULU' => ['lat' => -8.6000, 'lng' => 117.4800],
        'RHEE' => ['lat' => -8.4300, 'lng' => 117.2600],
        'UTAN' => ['lat' => -8.4200, 'lng' => 117.1600],
        'BUER' => ['lat' => -8.4300, 'lng' => 117.0600],
        'ALAS' => ['lat' => -8.5200, 'lng' => 116.9800],
        'ALAS BARAT' => ['lat' => -8.5600, 'lng' => 116.9100],
        'LOPOK' => ['lat' => -8.6100, 'lng' => 117.5800],
        'LAPE' => ['lat' => -8.6200, 'lng' => 117.6500],
        'MARONGE' => ['lat' => -8.6500, 'lng' => 117.7200],
        'PLAMPANG' => ['lat' => -8.7300, 'lng' => 117.7900],
        'LABANGKA' => ['lat' => -8.8200, 'lng' => 117.7500],
        'EMPANG' => ['lat' => -8.7800, 'lng' => 117.9600],
        'TARANO' => ['lat' => -8.7500, 'lng' => 118.0800],
        'LENANG GUAR' => ['lat' => -8.6900, 'lng' => 117.3800],
        'ORONG TELU' => ['lat' => -8.7500, 'lng' => 117.2500],
        'ROPANG' => ['lat' => -8.8200, 'lng' => 117.4300],
        'LANTUNG' => ['lat' => -8.8800, 'lng' => 117.4900],
        'LUNYUK' => ['lat' => -8.9800, 'lng' => 117.2000],
        'BATU LANTEH' => ['lat' => -8.6000, 'lng' => 117.3000],

        // Dompu
        'DOMPU' => ['lat' => -8.5350, 'lng' => 118.4600],
        'WOJA' => ['lat' => -8.5250, 'lng' => 118.4300],
        'PAJO' => ['lat' => -8.6000, 'lng' => 118.4800],
        'HUU' => ['lat' => -8.7200, 'lng' => 118.4700],
        'MANGGELEWA' => ['lat' => -8.4700, 'lng' => 118.3100],
        'KEMPO' => ['lat' => -8.5200, 'lng' => 118.2500],
        'KILO' => ['lat' => -8.3500, 'lng' => 118.4500],
        'PEKAT' => ['lat' => -8.3000, 'lng' => 117.9500],

        // Bima & Kota Bima
        'RABA' => ['lat' => -8.4600, 'lng' => 118.7250],
        'MPUNDA' => ['lat' => -8.4650, 'lng' => 118.7180],
        'ASAKOTA' => ['lat' => -8.4400, 'lng' => 118.7200],
        'RASANAE BARAT' => ['lat' => -8.4700, 'lng' => 118.7100],
        'RASANAE TIMUR' => ['lat' => -8.4750, 'lng' => 118.7450],
        'WOHA' => ['lat' => -8.5800, 'lng' => 118.7300],
        'BOLO' => ['lat' => -8.5100, 'lng' => 118.6300],
        'MADAPANGGA' => ['lat' => -8.5200, 'lng' => 118.5700],
        'DONGGO' => ['lat' => -8.4500, 'lng' => 118.5800],
        'SOROMANDI' => ['lat' => -8.3800, 'lng' => 118.6600],
        'SANGGAR' => ['lat' => -8.3500, 'lng' => 118.5500],
        'TAMBORA' => ['lat' => -8.2500, 'lng' => 118.0000],
        'AMBALAWI' => ['lat' => -8.3500, 'lng' => 118.7800],
        'WERA' => ['lat' => -8.3200, 'lng' => 118.9200],
        'SAPE' => ['lat' => -8.5700, 'lng' => 119.0000],
        'LAMBU' => ['lat' => -8.6400, 'lng' => 119.0400],
        'WAWO' => ['lat' => -8.5300, 'lng' => 118.8300],
        'BELO' => ['lat' => -8.6200, 'lng' => 118.7400],
        'PALIBELO' => ['lat' => -8.5400, 'lng' => 118.7100],
        'MONTA' => ['lat' => -8.6700, 'lng' => 118.7100],
        'PARADO' => ['lat' => -8.7400, 'lng' => 118.6300],
        'LANGGUDU' => ['lat' => -8.7000, 'lng' => 118.8200],
        'LAMBITU' => ['lat' => -8.5800, 'lng' => 118.8500],
    ];

    /**
     * Resolve coordinate for a given kecamatan name with fuzzy match and deterministic fallback.
     *
     * @param  array{lat: float, lng: float, capital: string}|null  $kabCoords
     * @return array{lat: float, lng: float}
     */
    protected function getKecamatanCoordinates(string $kabupatenName, string $kecamatanName, int $index = 0, ?array $kabCoords = null): array
    {
        $cleaned = strtoupper(trim(preg_replace('/^(KEC\.?|KECAMATAN)\s+/i', '', $kecamatanName)));
        $cleaned = trim(str_replace('.', '', $cleaned));

        foreach (self::KECAMATAN_COORDINATES as $key => $coords) {
            if ($cleaned === $key || str_contains($cleaned, $key) || str_contains($key, $cleaned)) {
                return $coords;
            }
        }

        // Fallback: procedural radial offset around kabupaten center
        $centerLat = $kabCoords['lat'] ?? -8.65;
        $centerLng = $kabCoords['lng'] ?? 116.50;
        $angle = ($index * 36) * (M_PI / 180);
        $dist = 0.04 + (($index % 4) * 0.025);

        return [
            'lat' => $centerLat + ($dist * cos($angle)),
            'lng' => $centerLng + ($dist * sin($angle) * 1.1),
        ];
    }
}
