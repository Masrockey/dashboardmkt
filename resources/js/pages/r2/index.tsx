import { Head, router, useForm } from '@inertiajs/react';
import {
    Bike,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileSpreadsheet,
    FileText,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    User,
    Wrench,
    X,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import r2Route from '@/routes/r2';
import type { PaginatedR2, R2, R2FormData } from '@/types';

interface MasterDataTypeItem {
    id: number;
    nama_type: string;
    segment_id: number;
    nama_pasar: string;
    segment?: {
        id: number;
        nama_segment: string;
    };
}

interface R2IndexProps {
    r2s: PaginatedR2;
    filters: {
        search?: string;
    };
    masterData?: {
        kabupatens: string[];
        brands: string[];
        segments: string[];
        types: MasterDataTypeItem[];
    };
}

const initialFormData: R2FormData = {
    drv_desc: '',
    knd_nopol: '',
    knd_nama: '',
    knd_alamat: '',
    kel_desc: '',
    kec_desc: '',
    kab_desc: '',
    jns_desc: 'SPM R 2',
    mrk_desc: 'HONDA',
    pkb_desc: '',
    knd_thn_buat: '',
    knd_cyl: '',
    knd_rangka: '',
    knd_mesin: '',
    knd_warna: '',
    guna_desc: 'PRIBADI',
    wrn_desc: '',
    ctk_notice_tanggal: '',
    ctk_notice_seri: '',
    knd_tgl_notice_new: '',
    knd_tgl_notice_old: '',
    knd_df_jenis: '',
    model: 'SOLO',
    roda: '2',
    type: '',
    segment: '',
    nama_pasar: '',
};

const formatDateDisplay = (dateVal: string | null | undefined): string => {
    if (!dateVal) return '-';
    let clean = dateVal;
    if (clean.includes('T')) {
        clean = clean.split('T')[0];
    }
    if (clean.includes(' ')) {
        clean = clean.split(' ')[0];
    }
    const parts = clean.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
};

export default function R2Index({ r2s, filters, masterData }: R2IndexProps) {

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [selectedR2, setSelectedR2] = useState<R2 | null>(null);
    const [activeTab, setActiveTab] = useState<'identitas' | 'wilayah' | 'spesifikasi' | 'notice'>('identitas');

    // Create Form
    const createForm = useForm<R2FormData>(initialFormData);

    // Edit Form
    const editForm = useForm<R2FormData>(initialFormData);

    // Delete Form
    const deleteForm = useForm({});

    // Import Form
    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            r2Route.index.url({
                query: { search: searchQuery || undefined },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetSearch = () => {
        setSearchQuery('');
        router.get(
            r2Route.index.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        setActiveTab('identitas');
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(r2Route.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleOpenDetail = (item: R2) => {
        setSelectedR2(item);
        setIsDetailOpen(true);
    };

    const handleOpenEdit = (item: R2) => {
        setSelectedR2(item);
        editForm.setData({
            drv_desc: item.drv_desc || '',
            knd_nopol: item.knd_nopol || '',
            knd_nama: item.knd_nama || '',
            knd_alamat: item.knd_alamat || '',
            kel_desc: item.kel_desc || '',
            kec_desc: item.kec_desc || '',
            kab_desc: item.kab_desc || '',
            jns_desc: item.jns_desc || 'SPM R 2',
            mrk_desc: item.mrk_desc || 'HONDA',
            pkb_desc: item.pkb_desc || '',
            knd_thn_buat: item.knd_thn_buat || '',
            knd_cyl: item.knd_cyl || '',
            knd_rangka: item.knd_rangka || '',
            knd_mesin: item.knd_mesin || '',
            knd_warna: item.knd_warna || '',
            guna_desc: item.guna_desc || 'PRIBADI',
            wrn_desc: item.wrn_desc || '',
            ctk_notice_tanggal: item.ctk_notice_tanggal || '',
            ctk_notice_seri: item.ctk_notice_seri || '',
            knd_tgl_notice_new: item.knd_tgl_notice_new || '',
            knd_tgl_notice_old: item.knd_tgl_notice_old || '',
            knd_df_jenis: item.knd_df_jenis || '',
            model: item.model || 'SOLO',
            roda: item.roda || '2',
            type: item.type || item.pkb_desc || '',
            segment: item.segment || '',
            nama_pasar: item.nama_pasar || '',
        });
        editForm.clearErrors();
        setActiveTab('identitas');
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedR2) return;

        editForm.put(r2Route.update.url(selectedR2.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedR2(null);
            },
        });
    };

    const handleOpenDelete = (item: R2) => {
        setSelectedR2(item);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedR2) return;

        deleteForm.delete(r2Route.destroy.url(selectedR2.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedR2(null);
            },
        });
    };

    const handleOpenImport = () => {
        importForm.reset();
        importForm.clearErrors();
        setIsImportOpen(true);
    };

    const handleImportSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!importForm.data.file) return;

        importForm.post(r2Route.import.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setIsImportOpen(false);
                importForm.reset();
            },
        });
    };

    const renderFormFields = (form: typeof createForm) => {
        return (
            <div className="space-y-4">
                {/* Custom Tabs */}
                <div className="flex border-b border-border text-sm font-medium gap-2 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('identitas')}
                        className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                            activeTab === 'identitas'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <User className="size-4" />
                        Identitas & Driver
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('wilayah')}
                        className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                            activeTab === 'wilayah'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <MapPin className="size-4" />
                        Wilayah
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('spesifikasi')}
                        className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                            activeTab === 'spesifikasi'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Wrench className="size-4" />
                        Kendaraan & Spec
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('notice')}
                        className={`px-3 py-2 border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
                            activeTab === 'notice'
                                ? 'border-primary text-primary font-semibold'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <FileText className="size-4" />
                        Notice & Cetak
                    </button>
                </div>

                {/* Tab Content: Identitas */}
                {activeTab === 'identitas' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="drv_desc">Driver Desc (drv_desc)</Label>
                            <Input
                                id="drv_desc"
                                value={form.data.drv_desc}
                                onChange={(e) => form.setData('drv_desc', e.target.value)}
                                placeholder="Deskripsi Driver"
                            />
                            <InputError message={form.errors.drv_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_nopol">No. Polisi (knd_nopol)</Label>
                            <Input
                                id="knd_nopol"
                                value={form.data.knd_nopol}
                                onChange={(e) => form.setData('knd_nopol', e.target.value)}
                                placeholder="Contoh: EA 1234 XX"
                            />
                            <InputError message={form.errors.knd_nopol} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_nama">Nama Pemilik (knd_nama)</Label>
                            <Input
                                id="knd_nama"
                                value={form.data.knd_nama}
                                onChange={(e) => form.setData('knd_nama', e.target.value)}
                                placeholder="Nama Pemilik Kendaraan"
                            />
                            <InputError message={form.errors.knd_nama} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="knd_alamat">Alamat Kendaraan (knd_alamat)</Label>
                            <Input
                                id="knd_alamat"
                                value={form.data.knd_alamat}
                                onChange={(e) => form.setData('knd_alamat', e.target.value)}
                                placeholder="Alamat Lengkap Pemilik"
                            />
                            <InputError message={form.errors.knd_alamat} />
                        </div>
                    </div>
                )}

                {/* Tab Content: Wilayah */}
                {activeTab === 'wilayah' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="kel_desc">Kelurahan (kel_desc)</Label>
                            <Input
                                id="kel_desc"
                                value={form.data.kel_desc}
                                onChange={(e) => form.setData('kel_desc', e.target.value)}
                                placeholder="Nama Kelurahan / Desa"
                            />
                            <InputError message={form.errors.kel_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kec_desc">Kecamatan (kec_desc)</Label>
                            <Input
                                id="kec_desc"
                                value={form.data.kec_desc}
                                onChange={(e) => form.setData('kec_desc', e.target.value)}
                                placeholder="Nama Kecamatan"
                            />
                            <InputError message={form.errors.kec_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kab_desc">Kabupaten (kab_desc)</Label>
                            <Input
                                id="kab_desc"
                                list="kab-datalist"
                                value={form.data.kab_desc}
                                onChange={(e) => form.setData('kab_desc', e.target.value)}
                                placeholder="Nama Kabupaten / Kota"
                            />
                            {masterData?.kabupatens && (
                                <datalist id="kab-datalist">
                                    {masterData.kabupatens.map((k) => (
                                        <option key={k} value={k} />
                                    ))}
                                </datalist>
                            )}
                            <InputError message={form.errors.kab_desc} />
                        </div>
                    </div>
                )}

                {/* Tab Content: Spesifikasi */}
                {activeTab === 'spesifikasi' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="mrk_desc">Brand / Merk (mrk_desc)</Label>
                            <Input
                                id="mrk_desc"
                                list="brand-datalist"
                                value={form.data.mrk_desc}
                                onChange={(e) => form.setData('mrk_desc', e.target.value)}
                                placeholder="Contoh: HONDA, YAMAHA"
                            />
                            {masterData?.brands && (
                                <datalist id="brand-datalist">
                                    {masterData.brands.map((b) => (
                                        <option key={b} value={b} />
                                    ))}
                                </datalist>
                            )}
                            <InputError message={form.errors.mrk_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input
                                id="model"
                                value={form.data.model}
                                onChange={(e) => form.setData('model', e.target.value)}
                                placeholder="Contoh: SOLO"
                            />
                            <InputError message={form.errors.model} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="roda">Jumlah Roda</Label>
                            <Input
                                id="roda"
                                value={form.data.roda}
                                onChange={(e) => form.setData('roda', e.target.value)}
                                placeholder="Contoh: 2"
                            />
                            <InputError message={form.errors.roda} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">TYPE Kendaraan</Label>
                            <Input
                                id="type"
                                list="type-datalist"
                                value={form.data.type}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const found = masterData?.types?.find(
                                        (t) => t.nama_type.toUpperCase() === val.toUpperCase(),
                                    );
                                    form.setData((prev) => ({
                                        ...prev,
                                        type: val,
                                        pkb_desc: val,
                                        segment: found?.segment?.nama_segment || prev.segment,
                                        nama_pasar: found?.nama_pasar || prev.nama_pasar,
                                    }));
                                }}
                                placeholder="Contoh: X1H02N32L1 A/T"
                            />
                            {masterData?.types && (
                                <datalist id="type-datalist">
                                    {masterData.types.map((t) => (
                                        <option key={t.id} value={t.nama_type}>
                                            {t.nama_pasar} ({t.segment?.nama_segment || '-'})
                                        </option>
                                    ))}
                                </datalist>
                            )}
                            <InputError message={form.errors.type} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="segment">Segment</Label>
                            <Input
                                id="segment"
                                list="segment-datalist"
                                value={form.data.segment}
                                onChange={(e) => form.setData('segment', e.target.value)}
                                placeholder="Contoh: AT HIGH, AT LOW"
                            />
                            {masterData?.segments && (
                                <datalist id="segment-datalist">
                                    {masterData.segments.map((s) => (
                                        <option key={s} value={s} />
                                    ))}
                                </datalist>
                            )}
                            <InputError message={form.errors.segment} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nama_pasar">Nama Pasar</Label>
                            <Input
                                id="nama_pasar"
                                value={form.data.nama_pasar}
                                onChange={(e) => form.setData('nama_pasar', e.target.value)}
                                placeholder="Contoh: Vario 160 CBS"
                            />
                            <InputError message={form.errors.nama_pasar} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jns_desc">Jenis (jns_desc)</Label>
                            <Input
                                id="jns_desc"
                                value={form.data.jns_desc}
                                onChange={(e) => form.setData('jns_desc', e.target.value)}
                                placeholder="Contoh: SPM R 2"
                            />
                            <InputError message={form.errors.jns_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guna_desc">Penggunaan (guna_desc)</Label>
                            <Input
                                id="guna_desc"
                                value={form.data.guna_desc}
                                onChange={(e) => form.setData('guna_desc', e.target.value)}
                                placeholder="Contoh: PRIBADI"
                            />
                            <InputError message={form.errors.guna_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pkb_desc">PKB Desc (pkb_desc)</Label>
                            <Input
                                id="pkb_desc"
                                value={form.data.pkb_desc}
                                onChange={(e) => form.setData('pkb_desc', e.target.value)}
                                placeholder="Deskripsi PKB"
                            />
                            <InputError message={form.errors.pkb_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_thn_buat">Tahun Buat (knd_thn_buat)</Label>
                            <Input
                                id="knd_thn_buat"
                                value={form.data.knd_thn_buat}
                                onChange={(e) => form.setData('knd_thn_buat', e.target.value)}
                                placeholder="Contoh: 2026"
                            />
                            <InputError message={form.errors.knd_thn_buat} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_cyl">Cylinder / CC (knd_cyl)</Label>
                            <Input
                                id="knd_cyl"
                                value={form.data.knd_cyl}
                                onChange={(e) => form.setData('knd_cyl', e.target.value)}
                                placeholder="Contoh: 150"
                            />
                            <InputError message={form.errors.knd_cyl} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_rangka">No. Rangka (knd_rangka)</Label>
                            <Input
                                id="knd_rangka"
                                value={form.data.knd_rangka}
                                onChange={(e) => form.setData('knd_rangka', e.target.value)}
                                placeholder="Nomor Rangka"
                            />
                            <InputError message={form.errors.knd_rangka} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_mesin">No. Mesin (knd_mesin)</Label>
                            <Input
                                id="knd_mesin"
                                value={form.data.knd_mesin}
                                onChange={(e) => form.setData('knd_mesin', e.target.value)}
                                placeholder="Nomor Mesin"
                            />
                            <InputError message={form.errors.knd_mesin} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_warna">Warna Kendaraan (knd_warna)</Label>
                            <Input
                                id="knd_warna"
                                value={form.data.knd_warna}
                                onChange={(e) => form.setData('knd_warna', e.target.value)}
                                placeholder="Warna Kendaraan"
                            />
                            <InputError message={form.errors.knd_warna} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wrn_desc">Warna TNKB (wrn_desc)</Label>
                            <Input
                                id="wrn_desc"
                                value={form.data.wrn_desc}
                                onChange={(e) => form.setData('wrn_desc', e.target.value)}
                                placeholder="Contoh: HITAM / PUTIH"
                            />
                            <InputError message={form.errors.wrn_desc} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_df_jenis">DF Jenis (knd_df_jenis)</Label>
                            <Input
                                id="knd_df_jenis"
                                value={form.data.knd_df_jenis}
                                onChange={(e) => form.setData('knd_df_jenis', e.target.value)}
                                placeholder="Jenis Daftar"
                            />
                            <InputError message={form.errors.knd_df_jenis} />
                        </div>
                    </div>
                )}

                {/* Tab Content: Notice */}
                {activeTab === 'notice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ctk_notice_tanggal">Tgl Cetak Notice (ctk_notice_tanggal)</Label>
                            <Input
                                id="ctk_notice_tanggal"
                                type="date"
                                value={form.data.ctk_notice_tanggal}
                                onChange={(e) => form.setData('ctk_notice_tanggal', e.target.value)}
                            />
                            <InputError message={form.errors.ctk_notice_tanggal} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ctk_notice_seri">Seri Cetak Notice (ctk_notice_seri)</Label>
                            <Input
                                id="ctk_notice_seri"
                                value={form.data.ctk_notice_seri}
                                onChange={(e) => form.setData('ctk_notice_seri', e.target.value)}
                                placeholder="Nomor Seri Notice"
                            />
                            <InputError message={form.errors.ctk_notice_seri} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_tgl_notice_new">Tgl Notice Baru (knd_tgl_notice_new)</Label>
                            <Input
                                id="knd_tgl_notice_new"
                                type="date"
                                value={form.data.knd_tgl_notice_new}
                                onChange={(e) => form.setData('knd_tgl_notice_new', e.target.value)}
                            />
                            <InputError message={form.errors.knd_tgl_notice_new} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="knd_tgl_notice_old">Tgl Notice Lama (knd_tgl_notice_old)</Label>
                            <Input
                                id="knd_tgl_notice_old"
                                type="date"
                                value={form.data.knd_tgl_notice_old}
                                onChange={(e) => form.setData('knd_tgl_notice_old', e.target.value)}
                            />
                            <InputError message={form.errors.knd_tgl_notice_old} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Head title="Marketing - R2" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Bike className="size-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Data R2 Marketing
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola data registrasi & notice kendaraan R2 (Roda 2) pemasaran.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:w-auto">
                        <Button variant="outline" onClick={handleOpenImport}>
                            <FileSpreadsheet className="mr-2 size-4 text-emerald-600 dark:text-emerald-400" />
                            Import Excel
                        </Button>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 size-4" />
                            Tambah Data R2
                        </Button>
                    </div>
                </div>

                {/* Filters & Actions */}
                <Card className="p-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari Nopol, Nama Pemilik, Merk, Jenis, Kabupaten..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-8"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={handleResetSearch}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        <Button type="submit" variant="secondary" className="sm:w-auto">
                            Cari
                        </Button>
                    </form>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="text-xs">
                                    <TableHead className="w-12 text-center whitespace-nowrap">No</TableHead>
                                    <TableHead className="whitespace-nowrap">TGL</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[150px]">PEMILIK</TableHead>
                                    <TableHead className="whitespace-nowrap min-w-[200px]">ALAMAT</TableHead>
                                    <TableHead className="whitespace-nowrap">KEL</TableHead>
                                    <TableHead className="whitespace-nowrap">KEC</TableHead>
                                    <TableHead className="bg-yellow-300 text-yellow-950 font-bold dark:bg-yellow-500/25 dark:text-yellow-300 border-x border-yellow-400/50 whitespace-nowrap text-center text-xs tracking-wider">
                                        KAB
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-center">MODEL</TableHead>
                                    <TableHead className="bg-yellow-300 text-yellow-950 font-bold dark:bg-yellow-500/25 dark:text-yellow-300 border-x border-yellow-400/50 whitespace-nowrap text-center text-xs tracking-wider">
                                        Brand
                                    </TableHead>
                                    <TableHead className="whitespace-nowrap text-center">RODA</TableHead>
                                    <TableHead className="whitespace-nowrap text-center">Tahun</TableHead>
                                    <TableHead className="whitespace-nowrap text-center">CC</TableHead>
                                    <TableHead className="whitespace-nowrap">Noka</TableHead>
                                    <TableHead className="whitespace-nowrap">Nosin</TableHead>
                                    <TableHead className="whitespace-nowrap">WARNA</TableHead>
                                    <TableHead className="bg-yellow-300 text-yellow-950 font-bold dark:bg-yellow-500/25 dark:text-yellow-300 border-x border-yellow-400/50 whitespace-nowrap text-center text-xs tracking-wider">
                                        TYPE
                                    </TableHead>
                                    <TableHead className="bg-yellow-300 text-yellow-950 font-bold dark:bg-yellow-500/25 dark:text-yellow-300 border-x border-yellow-400/50 whitespace-nowrap text-center text-xs tracking-wider">
                                        Segment
                                    </TableHead>
                                    <TableHead className="bg-yellow-300 text-yellow-950 font-bold dark:bg-yellow-500/25 dark:text-yellow-300 border-x border-yellow-400/50 whitespace-nowrap text-center text-xs tracking-wider">
                                        NAMA PASAR
                                    </TableHead>
                                    <TableHead className="text-right whitespace-nowrap sticky right-0 bg-background/95 shadow-xs">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {r2s.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={19} className="h-32 text-center text-muted-foreground">
                                            Tidak ada data ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    r2s.data.map((item, index) => (
                                        <TableRow key={item.id} className="text-xs hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40">
                                            <TableCell className="text-center font-medium">
                                                {(r2s.from ?? 1) + index}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-medium text-foreground">
                                                {formatDateDisplay(item.ctk_notice_tanggal || item.knd_tgl_notice_new)}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-semibold text-foreground">
                                                <div className="flex flex-col">
                                                    <span>{item.knd_nama || '-'}</span>
                                                    {item.knd_nopol && (
                                                        <span className="font-mono text-[10px] text-muted-foreground">{item.knd_nopol}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[220px] truncate" title={item.knd_alamat || ''}>
                                                {item.knd_alamat || '-'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{item.kel_desc || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{item.kec_desc || '-'}</TableCell>
                                            <TableCell className="bg-yellow-100/70 font-semibold text-yellow-950 dark:bg-yellow-500/15 dark:text-yellow-200 border-x border-yellow-200/60 dark:border-yellow-900/40 whitespace-nowrap">
                                                {item.kab_desc || '-'}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-center font-medium">
                                                {item.model || 'SOLO'}
                                            </TableCell>
                                            <TableCell className="bg-yellow-100/70 font-semibold text-yellow-950 dark:bg-yellow-500/15 dark:text-yellow-200 border-x border-yellow-200/60 dark:border-yellow-900/40 whitespace-nowrap">
                                                {item.mrk_desc || '-'}
                                            </TableCell>
                                            <TableCell className="text-center whitespace-nowrap">{item.roda || '2'}</TableCell>
                                            <TableCell className="text-center whitespace-nowrap">{item.knd_thn_buat || '-'}</TableCell>
                                            <TableCell className="text-center whitespace-nowrap">{item.knd_cyl || '-'}</TableCell>
                                            <TableCell className="font-mono text-[11px] whitespace-nowrap">{item.knd_rangka || '-'}</TableCell>
                                            <TableCell className="font-mono text-[11px] whitespace-nowrap">{item.knd_mesin || '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">{item.knd_warna || item.wrn_desc || '-'}</TableCell>
                                            <TableCell className="bg-yellow-100/70 font-semibold font-mono text-[11px] text-yellow-950 dark:bg-yellow-500/15 dark:text-yellow-200 border-x border-yellow-200/60 dark:border-yellow-900/40 whitespace-nowrap">
                                                {item.type || item.pkb_desc || '-'}
                                            </TableCell>
                                            <TableCell className="bg-yellow-100/70 font-semibold text-yellow-950 dark:bg-yellow-500/15 dark:text-yellow-200 border-x border-yellow-200/60 dark:border-yellow-900/40 whitespace-nowrap">
                                                {item.segment || '-'}
                                            </TableCell>
                                            <TableCell className="bg-yellow-100/70 font-semibold text-yellow-950 dark:bg-yellow-500/15 dark:text-yellow-200 border-x border-yellow-200/60 dark:border-yellow-900/40 whitespace-nowrap">
                                                {item.nama_pasar || '-'}
                                            </TableCell>

                                            <TableCell className="text-right whitespace-nowrap sticky right-0 bg-background/95 shadow-xs">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => handleOpenDetail(item)}
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => handleOpenEdit(item)}
                                                        title="Edit Data"
                                                    >
                                                        <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() => handleOpenDelete(item)}
                                                        title="Hapus Data"
                                                    >
                                                        <Trash2 className="size-3.5 text-destructive hover:text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {r2s.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-border p-4 sm:flex-row">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan <span className="font-medium">{r2s.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{r2s.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{r2s.total}</span> data R2
                            </p>

                            <div className="flex items-center gap-1">
                                {r2s.links.map((link, i) => {
                                    if (link.label.includes('Previous')) {
                                        return (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url)}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                        );
                                    }
                                    if (link.label.includes('Next')) {
                                        return (
                                            <Button
                                                key={i}
                                                variant="outline"
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url)}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        );
                                    }
                                    return (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Import Excel Dialog */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
                            Import Data R2 dari Excel
                        </DialogTitle>
                        <DialogDescription>
                            Pilih file berkas spreadsheet (.xlsx, .xls, atau .csv) untuk mengimpor data massal kendaraan R2.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="excel_file">File Excel (.xlsx / .xls / .csv)</Label>
                            <div className="border-2 border-dashed border-muted-foreground/30 hover:border-primary rounded-lg p-4 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 relative">
                                <input
                                    id="excel_file"
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        importForm.setData('file', file);
                                    }}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <Upload className="size-8 text-muted-foreground" />
                                    {importForm.data.file ? (
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {importForm.data.file.name}
                                        </span>
                                    ) : (
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">Klik di sini</span> atau seret file ke area ini
                                        </div>
                                    )}
                                </div>
                            </div>
                            <InputError message={importForm.errors.file} />
                        </div>

                        <DialogFooter className="mt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={importForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={!importForm.data.file || importForm.processing}>
                                {importForm.processing && <Spinner className="mr-2 size-4" />}
                                Unggah & Import
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Tambah Data R2</DialogTitle>
                        <DialogDescription>
                            Isi detail informasi kendaraan R2 di bawah ini.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        {renderFormFields(createForm)}

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={createForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Data R2</DialogTitle>
                        <DialogDescription>
                            Ubah informasi kendaraan R2.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {renderFormFields(editForm)}

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={editForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail View Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bike className="size-5 text-primary" />
                            Detail Data R2 - {selectedR2?.knd_nopol || 'Tanpa Nopol'}
                        </DialogTitle>
                        <DialogDescription>
                            Informasi lengkap kendaraan R2
                        </DialogDescription>
                    </DialogHeader>

                    {selectedR2 && (
                        <div className="space-y-6 py-2">
                            {/* Identitas Pemilik */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <User className="size-4" />
                                    Identitas Pemilik & Driver
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Driver Desc:</span>
                                        <span className="font-medium">{selectedR2.drv_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">No. Polisi:</span>
                                        <span className="font-medium font-mono">{selectedR2.knd_nopol || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Nama Pemilik:</span>
                                        <span className="font-medium">{selectedR2.knd_nama || '-'}</span>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-muted-foreground block text-xs">Alamat:</span>
                                        <span className="font-medium">{selectedR2.knd_alamat || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Wilayah */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    Wilayah
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Kelurahan:</span>
                                        <span className="font-medium">{selectedR2.kel_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Kecamatan:</span>
                                        <span className="font-medium">{selectedR2.kec_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Kabupaten:</span>
                                        <span className="font-medium">{selectedR2.kab_desc || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Spesifikasi Kendaraan */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Wrench className="size-4" />
                                    Spesifikasi Kendaraan
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg text-sm">
                                    <div className="bg-yellow-50/80 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200/60 dark:border-yellow-900/40">
                                        <span className="text-yellow-800 dark:text-yellow-400 block text-xs font-semibold">Brand (Master Data):</span>
                                        <span className="font-bold text-yellow-950 dark:text-yellow-100">{selectedR2.mrk_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Model:</span>
                                        <span className="font-medium">{selectedR2.model || 'SOLO'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Jumlah Roda:</span>
                                        <span className="font-medium">{selectedR2.roda || '2'}</span>
                                    </div>
                                    <div className="bg-yellow-50/80 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200/60 dark:border-yellow-900/40">
                                        <span className="text-yellow-800 dark:text-yellow-400 block text-xs font-semibold">TYPE (Master Data):</span>
                                        <span className="font-bold font-mono text-xs text-yellow-950 dark:text-yellow-100">{selectedR2.type || selectedR2.pkb_desc || '-'}</span>
                                    </div>
                                    <div className="bg-yellow-50/80 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200/60 dark:border-yellow-900/40">
                                        <span className="text-yellow-800 dark:text-yellow-400 block text-xs font-semibold">Segment (Master Data):</span>
                                        <span className="font-bold text-yellow-950 dark:text-yellow-100">{selectedR2.segment || '-'}</span>
                                    </div>
                                    <div className="bg-yellow-50/80 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200/60 dark:border-yellow-900/40">
                                        <span className="text-yellow-800 dark:text-yellow-400 block text-xs font-semibold">Nama Pasar (Master Data):</span>
                                        <span className="font-bold text-yellow-950 dark:text-yellow-100">{selectedR2.nama_pasar || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Jenis:</span>
                                        <span className="font-medium">{selectedR2.jns_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Penggunaan:</span>
                                        <span className="font-medium">{selectedR2.guna_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tahun Buat:</span>
                                        <span className="font-medium">{selectedR2.knd_thn_buat || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Cyl / CC:</span>
                                        <span className="font-medium">{selectedR2.knd_cyl || '-'}</span>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 min-w-0">
                                        <span className="text-muted-foreground block text-xs">No. Rangka:</span>
                                        <span className="font-medium font-mono text-xs break-all">{selectedR2.knd_rangka || '-'}</span>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 min-w-0">
                                        <span className="text-muted-foreground block text-xs">No. Mesin:</span>
                                        <span className="font-medium font-mono text-xs break-all">{selectedR2.knd_mesin || '-'}</span>
                                    </div>

                                    <div>
                                        <span className="text-muted-foreground block text-xs">Warna Kendaraan:</span>
                                        <span className="font-medium">{selectedR2.knd_warna || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Warna TNKB:</span>
                                        <span className="font-medium">{selectedR2.wrn_desc || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">DF Jenis:</span>
                                        <span className="font-medium">{selectedR2.knd_df_jenis || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notice & Cetak */}
                            <div>
                                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileText className="size-4" />
                                    Notice & Cetak
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg text-sm">
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tgl Notice Cetak:</span>
                                        <span className="font-medium">{formatDateDisplay(selectedR2.ctk_notice_tanggal)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Seri Notice Cetak:</span>
                                        <span className="font-medium">{selectedR2.ctk_notice_seri || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tgl Notice Baru:</span>
                                        <span className="font-medium">{formatDateDisplay(selectedR2.knd_tgl_notice_new)}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs">Tgl Notice Lama:</span>
                                        <span className="font-medium">{formatDateDisplay(selectedR2.knd_tgl_notice_old)}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Tutup
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus Data R2</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data kendaraan Nopol &quot;
                            <span className="font-semibold text-foreground">
                                {selectedR2?.knd_nopol || selectedR2?.knd_nama || 'ini'}
                            </span>
                            &quot;? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={deleteForm.processing}>
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleteForm.processing}
                        >
                            {deleteForm.processing && <Spinner className="mr-2 size-4" />}
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
