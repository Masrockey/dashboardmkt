import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpRight,
    Award,
    BarChart3,
    Bike,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Filter,
    Gauge,
    Layers,
    MapPin,
    PieChart,
    RotateCcw,
    Search,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import MarketingKabupatenMap, {
    type KecamatanMapItem,
    type TopBrandItem,
    type TopKecamatanStat,
} from '@/components/marketing-kabupaten-map';
import marketingRoute from '@/routes/marketing';
import r2Route from '@/routes/r2';

interface MarketingStats {
    total_units: number;
    honda_units: number;
    honda_market_share: number;
    competitor_units: number;
    competitor_market_share: number;
    total_kabupaten: number;
    total_kecamatan: number;
}

interface BrandDistributionItem {
    brand: string;
    count: number;
    percentage: number;
    is_honda: boolean;
}

interface KabupatenDistributionItem {
    kabupaten: string;
    total: number;
    honda_count: number;
    competitor_count: number;
    honda_share: number;
    percentage_of_total: number;
    latitude?: number | null;
    longitude?: number | null;
    capital?: string | null;
    top_brands?: TopBrandItem[];
    top_kecamatans?: TopKecamatanStat[];
    kecamatans?: KecamatanMapItem[];
}

interface TopKecamatanItem {
    kecamatan: string;
    kabupaten: string;
    total: number;
    honda_count: number;
    honda_share: number;
}

interface CylinderSegmentItem {
    label: string;
    count: number;
    percentage: number;
}

interface UsageDistributionItem {
    guna: string;
    count: number;
    percentage: number;
}

interface YearDistributionItem {
    year: string;
    count: number;
    percentage: number;
}

interface RecentRegistrationItem {
    id: number;
    knd_nopol: string | null;
    knd_nama: string | null;
    mrk_desc: string | null;
    pkb_desc: string | null;
    kab_desc: string | null;
    kec_desc: string | null;
    knd_thn_buat: string | null;
    knd_cyl: string | number | null;
    ctk_notice_tanggal: string | null;
}

interface MarketingDashboardProps {
    stats: MarketingStats;
    brandDistribution: BrandDistributionItem[];
    kabupatenDistribution: KabupatenDistributionItem[];
    topKecamatan: TopKecamatanItem[];
    cylinderSegments: CylinderSegmentItem[];
    usageDistribution: UsageDistributionItem[];
    yearDistribution: YearDistributionItem[];
    recentRegistrations: RecentRegistrationItem[];
    filterOptions: {
        kabupatens: string[];
        brands: string[];
        years: string[];
    };
    filters: {
        kabupaten: string;
        brand: string;
        year: string;
        start_date: string;
        end_date: string;
    };
}

export default function MarketingDashboard({
    stats,
    brandDistribution,
    kabupatenDistribution,
    topKecamatan,
    cylinderSegments,
    usageDistribution,
    yearDistribution,
    recentRegistrations,
    filterOptions,
    filters,
}: MarketingDashboardProps) {
    const [selectedKabupaten, setSelectedKabupaten] = useState<string>(filters.kabupaten || 'all');
    const [selectedBrand, setSelectedBrand] = useState<string>(filters.brand || 'all');
    const [selectedYear, setSelectedYear] = useState<string>(filters.year || 'all');
    const [startDate, setStartDate] = useState<string>(filters.start_date || '');
    const [endDate, setEndDate] = useState<string>(filters.end_date || '');
    const [showFilters, setShowFilters] = useState<boolean>(
        Boolean(filters.kabupaten || filters.brand || filters.year || filters.start_date || filters.end_date),
    );

    const activeFilterCount = [
        filters.kabupaten && filters.kabupaten !== 'all',
        filters.brand && filters.brand !== 'all',
        filters.year && filters.year !== 'all',
        Boolean(filters.start_date),
        Boolean(filters.end_date),
    ].filter(Boolean).length;

    const handleApplyFilter = () => {
        router.get(
            marketingRoute.dashboard.url(),
            {
                kabupaten: selectedKabupaten === 'all' ? '' : selectedKabupaten,
                brand: selectedBrand === 'all' ? '' : selectedBrand,
                year: selectedYear === 'all' ? '' : selectedYear,
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilter = () => {
        setSelectedKabupaten('all');
        setSelectedBrand('all');
        setSelectedYear('all');
        setStartDate('');
        setEndDate('');
        router.get(
            marketingRoute.dashboard.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSelectKabupatenFromMap = (kabupatenName: string) => {
        setSelectedKabupaten(kabupatenName);
        setShowFilters(true);
        router.get(
            marketingRoute.dashboard.url(),
            {
                kabupaten: kabupatenName,
                brand: selectedBrand === 'all' ? '' : selectedBrand,
                year: selectedYear === 'all' ? '' : selectedYear,
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const formatDateIndo = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <>
            <Head title="Dashboard Marketing" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Welcome & Shortcut */}
                <div className="flex flex-col gap-4 border-b border-sidebar-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-sidebar-border">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Dashboard Marketing
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Analisis performa pangsa pasar kendaraan roda dua, dominasi Honda vs Kompetitor, dan persebaran wilayah.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant={activeFilterCount > 0 ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowFilters(!showFilters)}
                            className="gap-1.5 text-xs"
                        >
                            <Filter className="size-3.5" />
                            Filter Data
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>

                        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Link href={r2Route.index.url()}>
                                <Bike className="size-3.5" />
                                Kelola Data R2
                                <ArrowUpRight className="size-3 text-neutral-400" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Filter Collapsible Card */}
                {showFilters && (
                    <Card className="border-sidebar-border/70 bg-neutral-50/50 shadow-xs dark:border-sidebar-border dark:bg-neutral-900/30">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="size-4 text-neutral-600 dark:text-neutral-400" />
                                    <CardTitle className="text-sm font-semibold">Filter Analisis Marketing</CardTitle>
                                </div>
                                {activeFilterCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleResetFilter}
                                        className="h-7 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                                    >
                                        <RotateCcw className="mr-1 size-3" />
                                        Reset Filter
                                    </Button>
                                )}
                            </div>
                            <CardDescription className="text-xs">
                                Saring data menurut kabupaten, merk, tahun produksi, dan periode tanggal pencetakan notice.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                {/* Filter Kabupaten */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Kabupaten / Kota</Label>
                                    <Select value={selectedKabupaten} onValueChange={setSelectedKabupaten}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Kabupaten" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kabupaten</SelectItem>
                                            {filterOptions.kabupatens.map((kab) => (
                                                <SelectItem key={kab} value={kab}>
                                                    {kab}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filter Brand */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Merk Kendaraan</Label>
                                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Merk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Merk</SelectItem>
                                            {filterOptions.brands.map((b) => (
                                                <SelectItem key={b} value={b}>
                                                    {b}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filter Year */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tahun Pembuatan</Label>
                                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                                        <SelectTrigger className="h-9 text-xs">
                                            <SelectValue placeholder="Semua Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tahun</SelectItem>
                                            {filterOptions.years.map((y) => (
                                                <SelectItem key={y} value={y}>
                                                    {y}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filter Tanggal Notice Mulai */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tgl Notice Dari</Label>
                                    <Input
                                        type="date"
                                        className="h-9 text-xs"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                {/* Filter Tanggal Notice Sampai */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tgl Notice Sampai</Label>
                                    <Input
                                        type="date"
                                        className="h-9 text-xs"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilter}
                                    className="h-8 text-xs"
                                >
                                    Reset
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleApplyFilter}
                                    className="h-8 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs"
                                >
                                    <Search className="size-3.5" />
                                    Terapkan Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* KPI Stat Cards (4 Cards) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Registrasi R2 */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Total Data
                            </CardTitle>
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950/60">
                                <Bike className="size-4 text-blue-700 dark:text-blue-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.total_units.toLocaleString('id-ID')}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Unit terdata pada sistem
                            </p>
                        </CardContent>
                    </Card>

                    {/* Honda Market Share */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                                Honda Market Share
                            </CardTitle>
                            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-950/60">
                                <TrendingUp className="size-4 text-red-700 dark:text-red-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {stats.honda_market_share}%
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    ({stats.honda_units.toLocaleString('id-ID')} unit)
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                                <div
                                    className="h-1.5 rounded-full bg-red-600"
                                    style={{ width: `${Math.min(100, stats.honda_market_share)}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                Dominasi unit merk Honda di NTB
                            </p>
                        </CardContent>
                    </Card>

                    {/* Unit Kompetitor */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Pangsa Kompetitor
                            </CardTitle>
                            <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                                <Users className="size-4 text-neutral-600 dark:text-neutral-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                    {stats.competitor_market_share}%
                                </div>
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                    ({stats.competitor_units.toLocaleString('id-ID')} unit)
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
                                <div
                                    className="h-1.5 rounded-full bg-neutral-500 dark:bg-neutral-400"
                                    style={{ width: `${Math.min(100, stats.competitor_market_share)}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                Total gabungan seluruh merk kompetitor
                            </p>
                        </CardContent>
                    </Card>

                    {/* Cakupan Wilayah */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Sebaran Wilayah
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950/60">
                                <MapPin className="size-4 text-emerald-700 dark:text-emerald-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.total_kabupaten}{' '}
                                <span className="text-sm font-normal text-neutral-500">Kabupaten</span>
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Meliputi {stats.total_kecamatan} kecamatan aktif di NTB
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Peta Sebaran Wilayah R2 NTB (OpenStreetMap) */}
                <MarketingKabupatenMap
                    kabupatenData={kabupatenDistribution}
                    selectedKabupatenFilter={selectedKabupaten}
                    onSelectKabupatenFilter={handleSelectKabupatenFromMap}
                    height="500px"
                />

                {/* Analytics Grid: Brand Distribution & Cylinder Segments */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Brand Market Share Distribution (7 Cols) */}
                    <Card className="border-sidebar-border/70 shadow-xs lg:col-span-7 dark:border-sidebar-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <BarChart3 className="size-4 text-red-600" />
                                        Distribusi Pangsa Pasar Merk Kendaraan
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Perbandingan persentase dan volume unit terdaftar per merek di NTB.
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300 text-xs">
                                    Top Brands
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {brandDistribution.length === 0 ? (
                                <div className="py-8 text-center text-xs text-neutral-500">
                                    Tidak ada data merk kendaraan yang sesuai dengan filter.
                                </div>
                            ) : (
                                brandDistribution.map((item) => (
                                    <div key={item.brand} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2 font-medium">
                                                <span className={item.is_honda ? 'font-bold text-red-600 dark:text-red-400' : 'text-neutral-800 dark:text-neutral-200'}>
                                                    {item.brand}
                                                </span>
                                                {item.is_honda && (
                                                    <Badge className="bg-red-600 text-white hover:bg-red-700 text-[10px] h-4 px-1.5">
                                                        HONDA
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                                <span>{item.count.toLocaleString('id-ID')} unit</span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    ({item.percentage}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    item.is_honda
                                                        ? 'bg-red-600'
                                                        : 'bg-neutral-400 dark:bg-neutral-600'
                                                }`}
                                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                <span>Honda memimpin dengan pangsa pasar <strong>{stats.honda_market_share}%</strong></span>
                                <span className="text-[11px] text-neutral-400">Data update real-time</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cylinder Capacity (CC) Segment (5 Cols) */}
                    <Card className="border-sidebar-border/70 shadow-xs lg:col-span-5 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Gauge className="size-4 text-blue-600" />
                                Segmentasi Kapasitas Mesin (CC)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Proporsi motor berdasarkan kapasitas silinder silinder / CC mesin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {cylinderSegments.length === 0 ? (
                                <div className="py-8 text-center text-xs text-neutral-500">
                                    Tidak ada data kapasitas mesin tercatat.
                                </div>
                            ) : (
                                cylinderSegments.map((segment, idx) => {
                                    const colors = [
                                        'bg-blue-600',
                                        'bg-indigo-600',
                                        'bg-emerald-600',
                                        'bg-amber-600',
                                        'bg-neutral-500',
                                    ];
                                    const barColor = colors[idx % colors.length];

                                    return (
                                        <div key={segment.label} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                                    {segment.label}
                                                </span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {segment.count.toLocaleString('id-ID')} unit ({segment.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${barColor}`}
                                                    style={{ width: `${Math.min(100, segment.percentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Additional insights: Usage breakdown pills */}
                            <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                                    Fungsi & Penggunaan Kendaraan:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {usageDistribution.map((item) => (
                                        <Badge
                                            key={item.guna}
                                            variant="secondary"
                                            className="text-xs py-1 px-2.5 font-normal"
                                        >
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100 mr-1.5">
                                                {item.guna}:
                                            </span>
                                            {item.count.toLocaleString('id-ID')} ({item.percentage}%)
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Regional Breakdown: Kabupaten Market Share Table & Top Kecamatan */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Kabupaten Market Share Table (8 Cols) */}
                    <Card className="border-sidebar-border/70 shadow-xs lg:col-span-8 dark:border-sidebar-border">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <MapPin className="size-4 text-emerald-600" />
                                        Pangsa Pasar Honda Per Kabupaten / Kota
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Tingkat penetrasi dan volume unit Honda dibanding kompetitor di setiap wilayah NTB.
                                    </CardDescription>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {kabupatenDistribution.length} Kabupaten / Kota
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="text-xs">
                                            <TableHead className="font-semibold">Wilayah (Kabupaten)</TableHead>
                                            <TableHead className="font-semibold text-right">Total Unit</TableHead>
                                            <TableHead className="font-semibold text-right">Unit Honda</TableHead>
                                            <TableHead className="font-semibold text-right">Kompetitor</TableHead>
                                            <TableHead className="font-semibold w-48">Pangsa Honda</TableHead>
                                            <TableHead className="font-semibold text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {kabupatenDistribution.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-6 text-xs text-neutral-500">
                                                    Tidak ada data kabupaten yang ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            kabupatenDistribution.map((item) => {
                                                const isDominant = item.honda_share >= 70;
                                                const isStrong = item.honda_share >= 50 && item.honda_share < 70;

                                                return (
                                                    <TableRow key={item.kabupaten} className="text-xs hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                                        <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {item.kabupaten}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {item.total.toLocaleString('id-ID')}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600 font-semibold dark:text-red-400">
                                                            {item.honda_count.toLocaleString('id-ID')}
                                                        </TableCell>
                                                        <TableCell className="text-right text-neutral-500">
                                                            {item.competitor_count.toLocaleString('id-ID')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-2 flex-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex">
                                                                    <div
                                                                        className="bg-red-600 h-full transition-all"
                                                                        style={{ width: `${Math.min(100, item.honda_share)}%` }}
                                                                        title={`Honda: ${item.honda_share}%`}
                                                                    />
                                                                    <div
                                                                        className="bg-neutral-400 dark:bg-neutral-600 h-full transition-all"
                                                                        style={{ width: `${Math.max(0, 100 - item.honda_share)}%` }}
                                                                        title={`Kompetitor: ${(100 - item.honda_share).toFixed(1)}%`}
                                                                    />
                                                                </div>
                                                                <span className="w-12 text-right font-bold text-neutral-800 dark:text-neutral-200">
                                                                    {item.honda_share}%
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {isDominant ? (
                                                                <Badge className="bg-red-600 hover:bg-red-700 text-white text-[10px] h-5">
                                                                    Dominan
                                                                </Badge>
                                                            ) : isStrong ? (
                                                                <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400 text-[10px] h-5">
                                                                    Kuat
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                                    Kompetitif
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top 8 Kecamatan Ranking (4 Cols) */}
                    <Card className="border-sidebar-border/70 shadow-xs lg:col-span-4 dark:border-sidebar-border">
                        <CardHeader>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <TrendingUp className="size-4 text-rose-600" />
                                Top 8 Kecamatan Terpadat
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Wilayah kecamatan dengan registrasi unit motor tertinggi di NTB.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topKecamatan.length === 0 ? (
                                <div className="py-8 text-center text-xs text-neutral-500">
                                    Tidak ada data kecamatan tercatat.
                                </div>
                            ) : (
                                topKecamatan.map((kec, index) => (
                                    <div
                                        key={`${kec.kecamatan}-${kec.kabupaten}`}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[11px]">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                    {kec.kecamatan}
                                                </div>
                                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                                                    {kec.kabupaten}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-neutral-900 dark:text-neutral-100">
                                                {kec.total.toLocaleString('id-ID')} unit
                                            </div>
                                            <div className="text-[11px] text-red-600 font-medium dark:text-red-400">
                                                Honda {kec.honda_share}%
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent R2 Registrations Preview Table */}
                <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <Bike className="size-4 text-neutral-700 dark:text-neutral-300" />
                                Preview Data Terbaru
                            </CardTitle>
                            <CardDescription className="text-xs">
                                6 transaksi notice registrasi R2 terbaru yang terekam dalam sistem.
                            </CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm" className="gap-1 text-xs self-start sm:self-auto">
                            <Link href={r2Route.index.url()}>
                                Buka Semua Data ({stats.total_units.toLocaleString('id-ID')})
                                <ChevronRight className="size-3.5" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="text-xs">
                                        <TableHead className="font-semibold">Nopol</TableHead>
                                        <TableHead className="font-semibold">Nama Pemilik</TableHead>
                                        <TableHead className="font-semibold">Merk</TableHead>
                                        <TableHead className="font-semibold">Model / PKB</TableHead>
                                        <TableHead className="font-semibold">Kabupaten</TableHead>
                                        <TableHead className="font-semibold">Kecamatan</TableHead>
                                        <TableHead className="font-semibold text-center">Tahun / CC</TableHead>
                                        <TableHead className="font-semibold text-right">Tgl Notice</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentRegistrations.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-6 text-xs text-neutral-500">
                                                Belum ada data registrasi unit R2.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentRegistrations.map((row) => {
                                            const isHonda = (row.mrk_desc || '').toUpperCase().includes('HONDA');

                                            return (
                                                <TableRow key={row.id} className="text-xs hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                                    <TableCell className="font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                                                        {row.knd_nopol || '-'}
                                                    </TableCell>
                                                    <TableCell className="max-w-[180px] truncate text-neutral-800 dark:text-neutral-200">
                                                        {row.knd_nama || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={isHonda ? 'default' : 'secondary'}
                                                            className={isHonda ? 'bg-red-600 text-white hover:bg-red-700 text-[10px] h-5' : 'text-[10px] h-5'}
                                                        >
                                                            {row.mrk_desc || '-'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-neutral-600 dark:text-neutral-400">
                                                        {row.pkb_desc || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-700 dark:text-neutral-300">
                                                        {row.kab_desc || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-neutral-600 dark:text-neutral-400">
                                                        {row.kec_desc || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-center text-neutral-600 dark:text-neutral-400">
                                                        {row.knd_thn_buat || '-'} {row.knd_cyl ? `(${row.knd_cyl} cc)` : ''}
                                                    </TableCell>
                                                    <TableCell className="text-right text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                        {formatDateIndo(row.ctk_notice_tanggal)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

