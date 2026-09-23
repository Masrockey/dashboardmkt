import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, MapPin, Store } from 'lucide-react';
import { type FormEvent, useMemo } from 'react';
import InputError from '@/components/input-error';
import LocationPickerMap from '@/components/location-picker-map';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import pameranRoute from '@/routes/pameran';
import type { Dealer, JenisPameran } from '@/types';

interface PameranCreateProps {
    dealers: Dealer[];
    jenisPameranList: JenisPameran[];
}

export default function PameranCreate({
    dealers,
    jenisPameranList,
}: PameranCreateProps) {
    const { auth } = usePage<{
        auth: {
            user: {
                id: number;
                name: string;
                role: string;
                dealer_id?: number | null;
            };
        };
    }>().props;

    const currentUser = auth.user;

    const createForm = useForm<{
        dealer_id: string;
        jenis_pameran_id: string;
        mulai_tanggal_sewa: string;
        tanggal_sewa_berakhir: string;
        kecamatan: string;
        detail_alamat: string;
        latitude: number | null;
        longitude: number | null;
        kode_pameran_ahm: string;
    }>({
        dealer_id: currentUser.role === 'dealer' && currentUser.dealer_id ? String(currentUser.dealer_id) : '',
        jenis_pameran_id: '',
        mulai_tanggal_sewa: '',
        tanggal_sewa_berakhir: '',
        kecamatan: '',
        detail_alamat: '',
        latitude: null,
        longitude: null,
        kode_pameran_ahm: '',
    });

    const selectedJenis = useMemo(() => {
        return jenisPameranList.find(
            (j) => String(j.id) === String(createForm.data.jenis_pameran_id),
        );
    }, [jenisPameranList, createForm.data.jenis_pameran_id]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(pameranRoute.store.url(), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Tambah Pameran" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header with back button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            asChild
                            className="size-9 shrink-0"
                            title="Kembali ke Daftar Pameran"
                        >
                            <Link href={pameranRoute.index()}>
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Tambah Pameran
                            </h1>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Pilih Dealer dan Jenis Channel, lalu tentukan periode sewa dan detail lokasi.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    {/* Info Alur Approval */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-xs dark:border-amber-900/60 dark:bg-amber-950/30">
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-amber-800 dark:text-amber-300">
                                Alur Persetujuan Pameran:
                            </span>
                            <span className="text-amber-700 dark:text-amber-400 leading-relaxed">
                                Setelah pameran dibuat, pameran akan menunggu persetujuan dari <strong>SPV</strong> lalu <strong>Kabag</strong>. Kode Pameran MD akan otomatis terbit setelah disetujui Kabag.
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Kolom Kiri: Data Pokok Pameran */}
                        <div className="flex flex-col gap-6 lg:col-span-5">
                            <Card className="p-5 md:p-6 border-sidebar-border/70 dark:border-sidebar-border">
                                <div className="mb-4 flex items-center gap-2 border-b pb-3 dark:border-neutral-800">
                                    <Store className="size-4 text-neutral-500" />
                                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        Data Pokok Pameran
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Kode Pameran AHM (Admin Only) */}
                                    {currentUser.role !== 'dealer' && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="kode_pameran_ahm">Kode Pameran AHM</Label>
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500">Opsional (Manual Admin)</span>
                                            </div>
                                            <Input
                                                id="kode_pameran_ahm"
                                                placeholder="Contoh: AHM-EXH-2026-001"
                                                value={createForm.data.kode_pameran_ahm}
                                                onChange={(e) => createForm.setData('kode_pameran_ahm', e.target.value)}
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.kode_pameran_ahm} />
                                        </div>
                                    )}

                                    {/* Nama Dealer */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="dealer_id">Nama Dealer</Label>
                                        <Select
                                            value={createForm.data.dealer_id ? String(createForm.data.dealer_id) : undefined}
                                            onValueChange={(val) => createForm.setData('dealer_id', val)}
                                            disabled={createForm.processing || (currentUser.role === 'dealer' && !!currentUser.dealer_id)}
                                        >
                                            <SelectTrigger id="dealer_id" className="w-full">
                                                <SelectValue placeholder="-- Pilih Dealer --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {dealers.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                        [{d.kode_dealer}] {d.nama_dealer}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={createForm.errors.dealer_id} />
                                    </div>

                                    {/* Nama Jenis Channel */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="jenis_pameran_id">Nama Jenis Channel</Label>
                                        <Select
                                            value={createForm.data.jenis_pameran_id ? String(createForm.data.jenis_pameran_id) : undefined}
                                            onValueChange={(val) => createForm.setData('jenis_pameran_id', val)}
                                            disabled={createForm.processing}
                                        >
                                            <SelectTrigger id="jenis_pameran_id" className="w-full">
                                                <SelectValue placeholder="-- Pilih Jenis Channel --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {jenisPameranList.map((j) => (
                                                    <SelectItem key={j.id} value={String(j.id)}>
                                                        [{j.kode_pameran}] {j.jenis_pameran}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={createForm.errors.jenis_pameran_id} />
                                    </div>

                                    {/* Periode Sewa */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="mulai_tanggal_sewa">Mulai Tanggal Sewa</Label>
                                            <Input
                                                id="mulai_tanggal_sewa"
                                                type="date"
                                                value={createForm.data.mulai_tanggal_sewa}
                                                onChange={(e) => createForm.setData('mulai_tanggal_sewa', e.target.value)}
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.mulai_tanggal_sewa} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="tanggal_sewa_berakhir">Tanggal Sewa Berakhir</Label>
                                            <Input
                                                id="tanggal_sewa_berakhir"
                                                type="date"
                                                value={createForm.data.tanggal_sewa_berakhir}
                                                onChange={(e) => createForm.setData('tanggal_sewa_berakhir', e.target.value)}
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.tanggal_sewa_berakhir} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Kolom Kanan: Lokasi & Titik Koordinat Peta */}
                        <div className="flex flex-col gap-6 lg:col-span-7">
                            <Card className="p-5 md:p-6 border-sidebar-border/70 dark:border-sidebar-border">
                                <div className="mb-4 flex items-center gap-2 border-b pb-3 dark:border-neutral-800">
                                    <MapPin className="size-4 text-red-500" />
                                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        Lokasi & Titik Koordinat Peta
                                    </h2>
                                </div>

                                <div className="space-y-5">
                                    {/* Peta Interaktif untuk Pilih Titik Lokasi */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label>Peta & Titik Lokasi Pameran</Label>
                                            <span className="text-xs text-neutral-400">
                                                Cari alamat atau klik titik pada peta
                                            </span>
                                        </div>
                                        <LocationPickerMap
                                            initialLat={createForm.data.latitude}
                                            initialLng={createForm.data.longitude}
                                            customIconUrl={selectedJenis?.icon_map_url || null}
                                            onLocationSelect={(res) => {
                                                createForm.setData((prev) => ({
                                                    ...prev,
                                                    kecamatan: res.kecamatan || prev.kecamatan,
                                                    detail_alamat: res.detailAlamat || prev.detail_alamat,
                                                    latitude: res.latitude,
                                                    longitude: res.longitude,
                                                }));
                                            }}
                                            height="340px"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {/* Kecamatan */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="kecamatan">Kecamatan</Label>
                                            <Input
                                                id="kecamatan"
                                                placeholder="Contoh: Mataram / Cakranegara"
                                                value={createForm.data.kecamatan}
                                                onChange={(e) => createForm.setData('kecamatan', e.target.value)}
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.kecamatan} />
                                        </div>

                                        {/* Detail Alamat */}
                                        <div className="space-y-1.5 sm:col-span-2">
                                            <Label htmlFor="detail_alamat">Detail Alamat</Label>
                                            <Textarea
                                                id="detail_alamat"
                                                rows={3}
                                                placeholder="Contoh: Depan pintu masuk utama Mall, sebelah barat lobby..."
                                                value={createForm.data.detail_alamat}
                                                onChange={(e) => createForm.setData('detail_alamat', e.target.value)}
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.detail_alamat} />
                                        </div>

                                        {/* Latitude */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="latitude">Latitude</Label>
                                                <span className="text-[11px] text-neutral-400">Otomatis / Manual</span>
                                            </div>
                                            <Input
                                                id="latitude"
                                                type="number"
                                                step="any"
                                                placeholder="Contoh: -8.5833807"
                                                value={createForm.data.latitude ?? ''}
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'latitude',
                                                        e.target.value === '' ? null : parseFloat(e.target.value),
                                                    )
                                                }
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.latitude} />
                                        </div>

                                        {/* Longitude */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="longitude">Longitude</Label>
                                                <span className="text-[11px] text-neutral-400">Otomatis / Manual</span>
                                            </div>
                                            <Input
                                                id="longitude"
                                                type="number"
                                                step="any"
                                                placeholder="Contoh: 116.1167899"
                                                value={createForm.data.longitude ?? ''}
                                                onChange={(e) =>
                                                    createForm.setData(
                                                        'longitude',
                                                        e.target.value === '' ? null : parseFloat(e.target.value),
                                                    )
                                                }
                                                disabled={createForm.processing}
                                            />
                                            <InputError message={createForm.errors.longitude} />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                            disabled={createForm.processing}
                        >
                            <Link href={pameranRoute.index()}>
                                Batal
                            </Link>
                        </Button>
                        <Button type="submit" disabled={createForm.processing} className="min-w-[140px]">
                            {createForm.processing && <Spinner className="mr-2 size-4" />}
                            Simpan Pameran
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

PameranCreate.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Pameran',
            href: pameranRoute.index(),
        },
        {
            title: 'Tambah Pameran',
            href: pameranRoute.create(),
        },
    ],
};

