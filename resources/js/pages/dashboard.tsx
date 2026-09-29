import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Compass,
    MapPin,
    Shield,
    Sparkles,
    Store,
    TrendingUp,
    Users,
} from 'lucide-react';
import DashboardMap from '@/components/dashboard-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import pameranRoute from '@/routes/pameran';
import type { JenisPameran, PameranItem, UserRole } from '@/types';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    dealer_id: number | null;
}

interface DashboardProps {
    mapPamerans: PameranItem[];
    stats: {
        total: number;
        berlangsung: number;
        akanDatang: number;
        menungguApproval: number;
        disetujui: number;
    };
    jenisPameranList: JenisPameran[];
}

export default function Dashboard({
    mapPamerans,
    stats,
    jenisPameranList,
}: DashboardProps) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const currentUser = auth.user;

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'superadmin':
                return (
                    <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-xs">
                        <Shield className="size-3" />
                        Super Admin
                    </Badge>
                );
            case 'spv':
                return (
                    <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs">
                        <Sparkles className="size-3" />
                        Supervisor (SPV)
                    </Badge>
                );
            case 'kabag':
                return (
                    <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs">
                        <TrendingUp className="size-3" />
                        Kepala Bagian (Kabag)
                    </Badge>
                );
            case 'dealer':
                return (
                    <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:text-emerald-400 gap-1 text-xs">
                        <Store className="size-3" />
                        Dealer
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{role}</Badge>;
        }
    };

    const formatDateIndo = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <>
            <Head title="Dashboard Channel" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header Welcome & Role Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sidebar-border/70 pb-5 dark:border-sidebar-border">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Selamat Datang, {currentUser.name}
                            </h1>
                            {getRoleBadge(currentUser.role)}
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Pantau persebaran titik lokasi channel dan jadwal sewa secara real-time di wilayah Anda.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Link href={pameranRoute.index.url()}>
                                <Store className="size-3.5" />
                                Kelola Channel
                                <ArrowUpRight className="size-3 text-neutral-400" />
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Kartu Statistik Ringkasan */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Total Channel */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Total Channel
                            </CardTitle>
                            <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                                <Store className="size-4 text-neutral-600 dark:text-neutral-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                {stats.total}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Seluruh jadwal channel terdaftar
                            </p>
                        </CardContent>
                    </Card>

                    {/* Sedang Berlangsung */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Sedang Berlangsung
                            </CardTitle>
                            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950/60">
                                <Clock className="size-4 text-emerald-700 dark:text-emerald-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                {stats.berlangsung}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Aktif beroperasi hari ini
                            </p>
                        </CardContent>
                    </Card>

                    {/* Akan Datang */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                Akan Datang
                            </CardTitle>
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950/60">
                                <CalendarDays className="size-4 text-blue-700 dark:text-blue-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {stats.akanDatang}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Jadwal sewa mendatang
                            </p>
                        </CardContent>
                    </Card>

                    {/* Menunggu Approval */}
                    <Card className="border-sidebar-border/70 shadow-xs dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                Menunggu Approval
                            </CardTitle>
                            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-950/60">
                                <AlertCircle className="size-4 text-amber-700 dark:text-amber-300" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                {stats.menungguApproval}
                            </div>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                Menunggu tinjauan SPV / Kabag
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Section Peta Persebaran Channel */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <MapPin className="size-4 text-neutral-700 dark:text-neutral-300" />
                                Peta Titik Lokasi Channel
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Arahkan kursor pada pinpoint channel untuk melihat detail dealer, kecamatan, dan periode sewa.
                            </p>
                        </div>
                    </div>

                    <DashboardMap
                        pamerans={mapPamerans}
                        jenisPameranList={jenisPameranList}
                        height="540px"
                    />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
    ],
};
