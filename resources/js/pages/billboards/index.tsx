import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    ExternalLink,
    Eye,
    Image as ImageIcon,
    Lightbulb,
    LightbulbOff,
    MapPin,
    Maximize2,
    Pencil,
    Plus,
    Presentation,
    Search,
    ShieldAlert,
    Trash2,
    Upload,
    Wrench,
    X,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import LocationPickerMap, {
    type LocationSelectResult,
} from '@/components/location-picker-map';
import LocationPreviewMap from '@/components/location-preview-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { dashboard } from '@/routes';
import billboardsRoute from '@/routes/billboards';
import type {
    Billboard,
    BillboardLampStatus,
    BillboardPhotoField,
    BillboardPhysicalStatus,
    BillboardStatusOption,
    PaginatedBillboards,
} from '@/types';

interface BillboardsIndexProps {
    billboards: PaginatedBillboards;
    stats: {
        total: number;
        lampu_menyala: number;
        fisik_rusak: number;
        segera_berakhir: number;
    };
    lampStatuses: BillboardStatusOption[];
    physicalStatuses: BillboardStatusOption[];
    can: {
        write: boolean;
        delete: boolean;
    };
    filters: {
        search?: string;
        status_lampu?: string;
        status_fisik?: string;
    };
}

const PHOTO_CONFIG: Array<{
    key: BillboardPhotoField;
    urlKey: 'foto_siang_url' | 'foto_malam_url' | 'foto_jarak_jauh_url' | 'foto_jarak_dekat_url';
    removeKey: 'remove_foto_siang' | 'remove_foto_malam' | 'remove_foto_jarak_jauh' | 'remove_foto_jarak_dekat';
    label: string;
    description: string;
}> = [
    {
        key: 'foto_siang',
        urlKey: 'foto_siang_url',
        removeKey: 'remove_foto_siang',
        label: 'Foto Siang Hari',
        description: 'Tampilan visual saat pencahayaan terang',
    },
    {
        key: 'foto_malam',
        urlKey: 'foto_malam_url',
        removeKey: 'remove_foto_malam',
        label: 'Foto Malam Hari',
        description: 'Pengecekan pencahayaan/lampu menyala',
    },
    {
        key: 'foto_jarak_jauh',
        urlKey: 'foto_jarak_jauh_url',
        removeKey: 'remove_foto_jarak_jauh',
        label: 'Foto Jarak Jauh',
        description: 'Jarak pandang & keterlihatan dari kejauhan',
    },
    {
        key: 'foto_jarak_dekat',
        urlKey: 'foto_jarak_dekat_url',
        removeKey: 'remove_foto_jarak_dekat',
        label: 'Foto Jarak Dekat',
        description: 'Rincian fisik billboard & visual iklan',
    },
];

export default function BillboardsIndex({
    billboards,
    stats,
    lampStatuses,
    physicalStatuses,
    can,
    filters,
}: BillboardsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedLampFilter, setSelectedLampFilter] = useState(filters.status_lampu || 'all');
    const [selectedPhysicalFilter, setSelectedPhysicalFilter] = useState(filters.status_fisik || 'all');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);

    // Detail & Photo Lightbox modal
    const [detailBillboard, setDetailBillboard] = useState<Billboard | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Map toggle inside modal
    const [showMapPicker, setShowMapPicker] = useState(false);

    // File input references for clearing
    const createFileInputs = {
        foto_siang: useRef<HTMLInputElement>(null),
        foto_malam: useRef<HTMLInputElement>(null),
        foto_jarak_jauh: useRef<HTMLInputElement>(null),
        foto_jarak_dekat: useRef<HTMLInputElement>(null),
    };

    const editFileInputs = {
        foto_siang: useRef<HTMLInputElement>(null),
        foto_malam: useRef<HTMLInputElement>(null),
        foto_jarak_jauh: useRef<HTMLInputElement>(null),
        foto_jarak_dekat: useRef<HTMLInputElement>(null),
    };

    // Local object URL previews
    const [createPreviews, setCreatePreviews] = useState<Record<BillboardPhotoField, string | null>>({
        foto_siang: null,
        foto_malam: null,
        foto_jarak_jauh: null,
        foto_jarak_dekat: null,
    });

    const [editPreviews, setEditPreviews] = useState<Record<BillboardPhotoField, string | null>>({
        foto_siang: null,
        foto_malam: null,
        foto_jarak_jauh: null,
        foto_jarak_dekat: null,
    });

    // Forms
    const createForm = useForm<{
        lokasi: string;
        latitude: string;
        longitude: string;
        ukuran: string;
        tanggal_pasang: string;
        tanggal_berakhir: string;
        status_lampu: BillboardLampStatus;
        status_fisik: BillboardPhysicalStatus;
        foto_siang: File | null;
        foto_malam: File | null;
        foto_jarak_jauh: File | null;
        foto_jarak_dekat: File | null;
    }>({
        lokasi: '',
        latitude: '',
        longitude: '',
        ukuran: '',
        tanggal_pasang: '',
        tanggal_berakhir: '',
        status_lampu: 'menyala',
        status_fisik: 'baik',
        foto_siang: null,
        foto_malam: null,
        foto_jarak_jauh: null,
        foto_jarak_dekat: null,
    });

    const editForm = useForm<{
        lokasi: string;
        latitude: string;
        longitude: string;
        ukuran: string;
        tanggal_pasang: string;
        tanggal_berakhir: string;
        status_lampu: BillboardLampStatus;
        status_fisik: BillboardPhysicalStatus;
        foto_siang: File | null;
        foto_malam: File | null;
        foto_jarak_jauh: File | null;
        foto_jarak_dekat: File | null;
        remove_foto_siang: boolean;
        remove_foto_malam: boolean;
        remove_foto_jarak_jauh: boolean;
        remove_foto_jarak_dekat: boolean;
    }>({
        lokasi: '',
        latitude: '',
        longitude: '',
        ukuran: '',
        tanggal_pasang: '',
        tanggal_berakhir: '',
        status_lampu: 'menyala',
        status_fisik: 'baik',
        foto_siang: null,
        foto_malam: null,
        foto_jarak_jauh: null,
        foto_jarak_dekat: null,
        remove_foto_siang: false,
        remove_foto_malam: false,
        remove_foto_jarak_jauh: false,
        remove_foto_jarak_dekat: false,
    });

    const deleteForm = useForm({});

    const handleFilterSubmit = (e?: FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            billboardsRoute.index.url({
                query: {
                    search: searchQuery || undefined,
                    status_lampu: selectedLampFilter === 'all' ? undefined : selectedLampFilter,
                    status_fisik: selectedPhysicalFilter === 'all' ? undefined : selectedPhysicalFilter,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedLampFilter('all');
        setSelectedPhysicalFilter('all');
        router.get(billboardsRoute.index.url(), {}, { preserveState: true, preserveScroll: true });
    };

    const isFiltered =
        searchQuery !== '' || selectedLampFilter !== 'all' || selectedPhysicalFilter !== 'all';

    // Create handlers
    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        setCreatePreviews({
            foto_siang: null,
            foto_malam: null,
            foto_jarak_jauh: null,
            foto_jarak_dekat: null,
        });
        Object.values(createFileInputs).forEach((ref) => {
            if (ref.current) ref.current.value = '';
        });
        setShowMapPicker(false);
        setIsCreateOpen(true);
    };

    const handleCreatePhotoChange = (field: BillboardPhotoField, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        createForm.setData(field, file);
        setCreatePreviews((prev) => ({
            ...prev,
            [field]: file ? URL.createObjectURL(file) : null,
        }));
    };

    const handleRemoveCreatePhoto = (field: BillboardPhotoField) => {
        createForm.setData(field, null);
        setCreatePreviews((prev) => ({ ...prev, [field]: null }));
        const input = createFileInputs[field].current;
        if (input) input.value = '';
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(billboardsRoute.store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    // Edit handlers
    const handleOpenEdit = (billboard: Billboard) => {
        setSelectedBillboard(billboard);
        editForm.clearErrors();
        editForm.setData({
            lokasi: billboard.lokasi,
            latitude: String(billboard.latitude),
            longitude: String(billboard.longitude),
            ukuran: billboard.ukuran,
            tanggal_pasang: billboard.tanggal_pasang ? billboard.tanggal_pasang.substring(0, 10) : '',
            tanggal_berakhir: billboard.tanggal_berakhir ? billboard.tanggal_berakhir.substring(0, 10) : '',
            status_lampu: billboard.status_lampu,
            status_fisik: billboard.status_fisik,
            foto_siang: null,
            foto_malam: null,
            foto_jarak_jauh: null,
            foto_jarak_dekat: null,
            remove_foto_siang: false,
            remove_foto_malam: false,
            remove_foto_jarak_jauh: false,
            remove_foto_jarak_dekat: false,
        });
        setEditPreviews({
            foto_siang: null,
            foto_malam: null,
            foto_jarak_jauh: null,
            foto_jarak_dekat: null,
        });
        Object.values(editFileInputs).forEach((ref) => {
            if (ref.current) ref.current.value = '';
        });
        setShowMapPicker(false);
        setIsEditOpen(true);
    };

    const handleEditPhotoChange = (field: BillboardPhotoField, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        editForm.setData({
            ...editForm.data,
            [field]: file,
            [`remove_${field}`]: false,
        });
        setEditPreviews((prev) => ({
            ...prev,
            [field]: file ? URL.createObjectURL(file) : null,
        }));
    };

    const handleRemoveEditPhoto = (field: BillboardPhotoField) => {
        editForm.setData({
            ...editForm.data,
            [field]: null,
            [`remove_${field}`]: true,
        });
        setEditPreviews((prev) => ({ ...prev, [field]: null }));
        const input = editFileInputs[field].current;
        if (input) input.value = '';
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedBillboard) return;

        router.post(
            billboardsRoute.update.url(selectedBillboard.id),
            {
                _method: 'PUT',
                lokasi: editForm.data.lokasi,
                latitude: editForm.data.latitude,
                longitude: editForm.data.longitude,
                ukuran: editForm.data.ukuran,
                tanggal_pasang: editForm.data.tanggal_pasang,
                tanggal_berakhir: editForm.data.tanggal_berakhir,
                status_lampu: editForm.data.status_lampu,
                status_fisik: editForm.data.status_fisik,
                foto_siang: editForm.data.foto_siang,
                foto_malam: editForm.data.foto_malam,
                foto_jarak_jauh: editForm.data.foto_jarak_jauh,
                foto_jarak_dekat: editForm.data.foto_jarak_dekat,
                remove_foto_siang: editForm.data.remove_foto_siang ? 1 : 0,
                remove_foto_malam: editForm.data.remove_foto_malam ? 1 : 0,
                remove_foto_jarak_jauh: editForm.data.remove_foto_jarak_jauh ? 1 : 0,
                remove_foto_jarak_dekat: editForm.data.remove_foto_jarak_dekat ? 1 : 0,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedBillboard(null);
                },
                onError: (errors) => {
                    editForm.setError(errors as Record<string, string>);
                },
            },
        );
    };

    // Delete handlers
    const handleOpenDelete = (billboard: Billboard) => {
        setSelectedBillboard(billboard);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedBillboard) return;
        deleteForm.delete(billboardsRoute.destroy.url(selectedBillboard.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedBillboard(null);
            },
        });
    };

    // Location selection helper for Map picker
    const handleLocationSelect = (
        result: LocationSelectResult,
        targetForm: typeof createForm | typeof editForm,
    ) => {
        targetForm.setData({
            ...targetForm.data,
            latitude: result.latitude.toFixed(6),
            longitude: result.longitude.toFixed(6),
            lokasi: targetForm.data.lokasi || result.detailAlamat || result.displayName || '',
        });
    };

    // Badge styling helpers
    const getLampBadge = (status: BillboardLampStatus) => {
        switch (status) {
            case 'menyala':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 gap-1 font-medium">
                        <Lightbulb className="size-3 text-emerald-600" />
                        Menyala
                    </Badge>
                );
            case 'mati':
                return (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 gap-1 font-medium">
                        <LightbulbOff className="size-3 text-rose-600" />
                        Mati
                    </Badge>
                );
            case 'tanpa_lampu':
                return (
                    <Badge variant="outline" className="text-neutral-600 dark:text-neutral-400 gap-1">
                        Tanpa Lampu
                    </Badge>
                );
        }
    };

    const getPhysicalBadge = (status: BillboardPhysicalStatus) => {
        switch (status) {
            case 'baik':
                return (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 gap-1 font-medium">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        Baik
                    </Badge>
                );
            case 'rusak_ringan':
                return (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 gap-1 font-medium">
                        <Wrench className="size-3 text-amber-600" />
                        Rusak Ringan
                    </Badge>
                );
            case 'rusak_berat':
                return (
                    <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 gap-1 font-medium">
                        <ShieldAlert className="size-3 text-rose-600" />
                        Rusak Berat
                    </Badge>
                );
        }
    };

    return (
        <>
            <Head title="Billboard - Promosi ATL" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Menu Billboard
                            </h1>
                            <Badge variant="secondary" className="font-semibold text-xs">
                                Promosi ATL
                            </Badge>
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola titik billboard pameran media promosi luar ruang, pemantauan lampu, fisik, dan dokumentasi evidence.
                        </p>
                    </div>

                    {can.write && (
                        <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="size-4" />
                            Tambah Billboard
                        </Button>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    <Presentation className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Total Titik
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.total}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <Lightbulb className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Lampu Menyala
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.lampu_menyala}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                    <Wrench className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Perlu Perbaikan
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.fisik_rusak}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Segera Berakhir (&le; 30 Hari)
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.segera_berakhir}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <form onSubmit={handleFilterSubmit} className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative flex w-full max-w-sm items-center">
                            <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Cari lokasi atau ukuran billboard..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-9"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="text-muted-foreground hover:text-foreground absolute right-3 size-4"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedLampFilter}
                                onValueChange={(val) => setSelectedLampFilter(val)}
                            >
                                <SelectTrigger className="w-[160px] text-xs">
                                    <SelectValue placeholder="Status Lampu" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Lampu</SelectItem>
                                    {lampStatuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedPhysicalFilter}
                                onValueChange={(val) => setSelectedPhysicalFilter(val)}
                            >
                                <SelectTrigger className="w-[160px] text-xs">
                                    <SelectValue placeholder="Status Fisik" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Fisik</SelectItem>
                                    {physicalStatuses.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button type="submit" variant="secondary" size="sm" className="h-9">
                                Terapkan
                            </Button>
                        </div>
                    </form>

                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 self-start lg:self-auto"
                        >
                            <X className="size-3.5" />
                            Reset Filter
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-950">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">No</TableHead>
                                <TableHead className="min-w-[200px]">Lokasi & Koordinat</TableHead>
                                <TableHead className="min-w-[120px]">Ukuran</TableHead>
                                <TableHead className="min-w-[180px]">Periode Pasang</TableHead>
                                <TableHead className="min-w-[130px]">Status Lampu</TableHead>
                                <TableHead className="min-w-[130px]">Status Fisik</TableHead>
                                <TableHead className="min-w-[160px]">Evidence Foto</TableHead>
                                <TableHead className="w-24 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {billboards.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-44 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                                            <Presentation className="size-10 opacity-30" />
                                            <p className="font-medium">Tidak ada data billboard ditemukan.</p>
                                            {isFiltered ? (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={handleResetFilters}
                                                    className="text-xs"
                                                >
                                                    Hapus filter pencarian
                                                </Button>
                                            ) : (
                                                can.write && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleOpenCreate}
                                                        className="mt-2"
                                                    >
                                                        <Plus className="mr-1.5 size-3.5" />
                                                        Tambah Billboard Pertama
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                billboards.data.map((item, index) => {
                                    const pageOffset = ((billboards.current_page || 1) - 1) * (billboards.per_page || 10);
                                    const rowNumber = pageOffset + index + 1;

                                    // Count uploaded photos
                                    const availablePhotos = [
                                        item.foto_siang_url,
                                        item.foto_malam_url,
                                        item.foto_jarak_jauh_url,
                                        item.foto_jarak_dekat_url,
                                    ].filter(Boolean);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {item.lokasi}
                                                    </span>
                                                    <a
                                                        href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline dark:text-indigo-400"
                                                    >
                                                        <MapPin className="size-3" />
                                                        {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                                                        <ExternalLink className="size-2.5 opacity-60" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {item.ukuran}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs text-neutral-600 dark:text-neutral-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3 text-neutral-400" />
                                                        <span>Pasang: {item.tanggal_pasang}</span>
                                                    </div>
                                                    {item.tanggal_berakhir && (
                                                        <div className="flex items-center gap-1.5 text-neutral-500">
                                                            <Clock className="size-3 text-neutral-400" />
                                                            <span>Berakhir: {item.tanggal_berakhir}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getLampBadge(item.status_lampu)}</TableCell>
                                            <TableCell>{getPhysicalBadge(item.status_fisik)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {availablePhotos.length > 0 ? (
                                                        <div className="flex items-center -space-x-1.5">
                                                            {availablePhotos.slice(0, 3).map((photoUrl, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setPreviewImage({
                                                                            url: photoUrl!,
                                                                            title: `Evidence ${item.lokasi}`,
                                                                        })
                                                                    }
                                                                    className="relative size-8 overflow-hidden rounded-md border-2 border-white bg-neutral-100 shadow-xs hover:scale-105 transition-transform dark:border-neutral-900"
                                                                >
                                                                    <img
                                                                        src={photoUrl!}
                                                                        alt="Evidence"
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">
                                                            Belum ada foto
                                                        </span>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                                                        onClick={() => setDetailBillboard(item)}
                                                    >
                                                        <Eye className="mr-1 size-3" />
                                                        {availablePhotos.length}/4 Foto
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        onClick={() => setDetailBillboard(item)}
                                                        title="Detail Billboard"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                    {can.write && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                            onClick={() => handleOpenEdit(item)}
                                                            title="Edit Billboard"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                    )}
                                                    {can.delete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                                            onClick={() => handleOpenDelete(item)}
                                                            title="Hapus Billboard"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {billboards.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{billboards.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{billboards.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{billboards.total}</span> billboard
                            </p>

                            <div className="flex items-center gap-1">
                                {billboards.prev_page_url ? (
                                    <Link
                                        href={billboards.prev_page_url}
                                        preserveScroll
                                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Sebelumnya
                                    </Link>
                                ) : (
                                    <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50 dark:border-neutral-800">
                                        Sebelumnya
                                    </span>
                                )}

                                {billboards.next_page_url ? (
                                    <Link
                                        href={billboards.next_page_url}
                                        preserveScroll
                                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Berikutnya
                                    </Link>
                                ) : (
                                    <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50 dark:border-neutral-800">
                                        Berikutnya
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog Create Billboard */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Presentation className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Tambah Data Billboard
                        </DialogTitle>
                        <DialogDescription>
                            Isi informasi lokasi, ukuran, jadwal pasang, status lampu, fisik, serta unggah 4 foto evidence.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-5">
                        {/* Section 1: Lokasi & Koordinat */}
                        <div className="space-y-3 rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Lokasi & Titik Koordinat
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => setShowMapPicker(!showMapPicker)}
                                >
                                    <MapPin className="size-3.5 text-indigo-600" />
                                    {showMapPicker ? 'Tutup Peta' : 'Pilih Titik di Peta'}
                                </Button>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-lokasi" className="text-xs font-semibold">
                                    Alamat / Nama Lokasi <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-lokasi"
                                    placeholder="Contoh: Jl. Pejanggik No. 45, Cakranegara, Mataram"
                                    value={createForm.data.lokasi}
                                    onChange={(e) => createForm.setData('lokasi', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.lokasi} />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-latitude" className="text-xs font-semibold">
                                        Latitude <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="create-latitude"
                                        placeholder="-8.583300"
                                        value={createForm.data.latitude}
                                        onChange={(e) => createForm.setData('latitude', e.target.value)}
                                        required
                                    />
                                    <InputError message={createForm.errors.latitude} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="create-longitude" className="text-xs font-semibold">
                                        Longitude <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="create-longitude"
                                        placeholder="116.116700"
                                        value={createForm.data.longitude}
                                        onChange={(e) => createForm.setData('longitude', e.target.value)}
                                        required
                                    />
                                    <InputError message={createForm.errors.longitude} />
                                </div>
                            </div>

                            {showMapPicker && (
                                <div className="pt-2">
                                    <div className="mb-2 text-[11px] text-neutral-500">
                                        Klik pada peta atau cari alamat untuk menentukan titik koordinat secara otomatis:
                                    </div>
                                    <LocationPickerMap
                                        initialLat={parseFloat(createForm.data.latitude) || null}
                                        initialLng={parseFloat(createForm.data.longitude) || null}
                                        height="260px"
                                        showRadius={false}
                                        onLocationSelect={(res) => handleLocationSelect(res, createForm)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section 2: Spesifikasi & Periode */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-ukuran" className="text-xs font-semibold">
                                    Ukuran Billboard <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-ukuran"
                                    placeholder="Contoh: 4 x 6 m, 5 x 10 m"
                                    value={createForm.data.ukuran}
                                    onChange={(e) => createForm.setData('ukuran', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.ukuran} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-tgl-pasang" className="text-xs font-semibold">
                                    Tanggal Pasang <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-tgl-pasang"
                                    type="date"
                                    value={createForm.data.tanggal_pasang}
                                    onChange={(e) => createForm.setData('tanggal_pasang', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.tanggal_pasang} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-tgl-berakhir" className="text-xs font-semibold">
                                    Tanggal Berakhir (Opsional)
                                </Label>
                                <Input
                                    id="create-tgl-berakhir"
                                    type="date"
                                    value={createForm.data.tanggal_berakhir}
                                    onChange={(e) => createForm.setData('tanggal_berakhir', e.target.value)}
                                />
                                <InputError message={createForm.errors.tanggal_berakhir} />
                            </div>
                        </div>

                        {/* Section 3: Status Lampu & Fisik */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Status Lampu <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={createForm.data.status_lampu}
                                    onValueChange={(val: BillboardLampStatus) =>
                                        createForm.setData('status_lampu', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status lampu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lampStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.status_lampu} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Status Fisik <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={createForm.data.status_fisik}
                                    onValueChange={(val: BillboardPhysicalStatus) =>
                                        createForm.setData('status_fisik', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status fisik" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {physicalStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.status_fisik} />
                            </div>
                        </div>

                        {/* Section 4: Evidence 4 Foto */}
                        <div className="space-y-3 pt-2">
                            <div>
                                <Label className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                                    Dokumentasi Evidence (4 Foto)
                                </Label>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Unggah foto evidence billboard (maks 5MB per file, format JPG, PNG, atau WEBP).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {PHOTO_CONFIG.map((photo) => {
                                    const preview = createPreviews[photo.key];
                                    return (
                                        <div
                                            key={photo.key}
                                            className="rounded-xl border border-neutral-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                                                        {photo.label}
                                                    </p>
                                                    <p className="text-[11px] text-neutral-500">
                                                        {photo.description}
                                                    </p>
                                                </div>
                                                {preview && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                                                        onClick={() => handleRemoveCreatePhoto(photo.key)}
                                                    >
                                                        Hapus
                                                    </Button>
                                                )}
                                            </div>

                                            {preview ? (
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-900">
                                                    <img
                                                        src={preview}
                                                        alt={photo.label}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50/60 p-3 text-center transition-colors hover:bg-neutral-100/60 dark:border-neutral-800 dark:bg-neutral-900/40">
                                                    <Upload className="size-5 text-neutral-400 mb-1" />
                                                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                                        Pilih file foto
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                        JPG, PNG, WEBP (Max 5MB)
                                                    </span>
                                                    <input
                                                        ref={createFileInputs[photo.key]}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleCreatePhotoChange(photo.key, e)}
                                                    />
                                                </label>
                                            )}
                                            <InputError message={createForm.errors[photo.key]} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={createForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {createForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Billboard
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Billboard */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Edit Data Billboard
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui informasi lokasi, ukuran, status fisik/lampu, dan foto evidence.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-5">
                        {/* Section 1: Lokasi & Koordinat */}
                        <div className="space-y-3 rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <div className="flex items-center justify-between">
                                <Label className="font-bold text-xs uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                    Lokasi & Titik Koordinat
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => setShowMapPicker(!showMapPicker)}
                                >
                                    <MapPin className="size-3.5 text-indigo-600" />
                                    {showMapPicker ? 'Tutup Peta' : 'Pilih Titik di Peta'}
                                </Button>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-lokasi" className="text-xs font-semibold">
                                    Alamat / Nama Lokasi <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-lokasi"
                                    value={editForm.data.lokasi}
                                    onChange={(e) => editForm.setData('lokasi', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.lokasi} />
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-latitude" className="text-xs font-semibold">
                                        Latitude <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-latitude"
                                        value={editForm.data.latitude}
                                        onChange={(e) => editForm.setData('latitude', e.target.value)}
                                        required
                                    />
                                    <InputError message={editForm.errors.latitude} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit-longitude" className="text-xs font-semibold">
                                        Longitude <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="edit-longitude"
                                        value={editForm.data.longitude}
                                        onChange={(e) => editForm.setData('longitude', e.target.value)}
                                        required
                                    />
                                    <InputError message={editForm.errors.longitude} />
                                </div>
                            </div>

                            {showMapPicker && (
                                <div className="pt-2">
                                    <div className="mb-2 text-[11px] text-neutral-500">
                                        Klik pada peta atau cari alamat untuk menentukan titik koordinat secara otomatis:
                                    </div>
                                    <LocationPickerMap
                                        initialLat={parseFloat(editForm.data.latitude) || null}
                                        initialLng={parseFloat(editForm.data.longitude) || null}
                                        height="260px"
                                        showRadius={false}
                                        onLocationSelect={(res) => handleLocationSelect(res, editForm)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Section 2: Spesifikasi & Periode */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-ukuran" className="text-xs font-semibold">
                                    Ukuran Billboard <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-ukuran"
                                    value={editForm.data.ukuran}
                                    onChange={(e) => editForm.setData('ukuran', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.ukuran} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-tgl-pasang" className="text-xs font-semibold">
                                    Tanggal Pasang <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-tgl-pasang"
                                    type="date"
                                    value={editForm.data.tanggal_pasang}
                                    onChange={(e) => editForm.setData('tanggal_pasang', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.tanggal_pasang} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit-tgl-berakhir" className="text-xs font-semibold">
                                    Tanggal Berakhir (Opsional)
                                </Label>
                                <Input
                                    id="edit-tgl-berakhir"
                                    type="date"
                                    value={editForm.data.tanggal_berakhir}
                                    onChange={(e) => editForm.setData('tanggal_berakhir', e.target.value)}
                                />
                                <InputError message={editForm.errors.tanggal_berakhir} />
                            </div>
                        </div>

                        {/* Section 3: Status Lampu & Fisik */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Status Lampu <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={editForm.data.status_lampu}
                                    onValueChange={(val: BillboardLampStatus) =>
                                        editForm.setData('status_lampu', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status lampu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lampStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.status_lampu} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">
                                    Status Fisik <span className="text-rose-500">*</span>
                                </Label>
                                <Select
                                    value={editForm.data.status_fisik}
                                    onValueChange={(val: BillboardPhysicalStatus) =>
                                        editForm.setData('status_fisik', val)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status fisik" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {physicalStatuses.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>
                                                {s.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.status_fisik} />
                            </div>
                        </div>

                        {/* Section 4: Evidence 4 Foto */}
                        <div className="space-y-3 pt-2">
                            <div>
                                <Label className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                                    Dokumentasi Evidence (4 Foto)
                                </Label>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    Unggah foto baru untuk mengganti foto yang ada atau hapus jika diperlukan.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {PHOTO_CONFIG.map((photo) => {
                                    const localPreview = editPreviews[photo.key];
                                    const existingUrl =
                                        !editForm.data[photo.removeKey] && selectedBillboard
                                            ? selectedBillboard[photo.urlKey]
                                            : null;
                                    const currentDisplayUrl = localPreview || existingUrl;

                                    return (
                                        <div
                                            key={photo.key}
                                            className="rounded-xl border border-neutral-200/90 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
                                        >
                                            <div className="mb-2 flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                                                        {photo.label}
                                                    </p>
                                                    <p className="text-[11px] text-neutral-500">
                                                        {photo.description}
                                                    </p>
                                                </div>
                                                {currentDisplayUrl && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-1.5 text-[11px] text-rose-600 hover:bg-rose-50"
                                                        onClick={() => handleRemoveEditPhoto(photo.key)}
                                                    >
                                                        Hapus Foto
                                                    </Button>
                                                )}
                                            </div>

                                            {currentDisplayUrl ? (
                                                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-neutral-100 dark:bg-neutral-900">
                                                    <img
                                                        src={currentDisplayUrl}
                                                        alt={photo.label}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50/60 p-3 text-center transition-colors hover:bg-neutral-100/60 dark:border-neutral-800 dark:bg-neutral-900/40">
                                                    <Upload className="size-5 text-neutral-400 mb-1" />
                                                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                                        Unggah foto baru
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">
                                                        JPG, PNG, WEBP (Max 5MB)
                                                    </span>
                                                    <input
                                                        ref={editFileInputs[photo.key]}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleEditPhotoChange(photo.key, e)}
                                                    />
                                                </label>
                                            )}
                                            <InputError message={editForm.errors[photo.key]} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={editForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {editForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Detail Billboard */}
            <Dialog open={detailBillboard !== null} onOpenChange={(open) => !open && setDetailBillboard(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Presentation className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Rincian Billboard & Evidence
                        </DialogTitle>
                        <DialogDescription>
                            Informasi detail lokasi, status operasional, dan galeri evidence 4 sudut pandang.
                        </DialogDescription>
                    </DialogHeader>

                    {detailBillboard && (
                        <div className="space-y-5">
                            {/* Metadata Overview */}
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60 text-xs">
                                <div>
                                    <span className="text-neutral-500">Ukuran</span>
                                    <p className="font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                        {detailBillboard.ukuran}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Status Lampu</span>
                                    <div className="mt-0.5">{getLampBadge(detailBillboard.status_lampu)}</div>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Status Fisik</span>
                                    <div className="mt-0.5">{getPhysicalBadge(detailBillboard.status_fisik)}</div>
                                </div>
                                <div>
                                    <span className="text-neutral-500">Masa Pasang</span>
                                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {detailBillboard.tanggal_pasang}
                                        {detailBillboard.tanggal_berakhir && (
                                            <span className="text-[11px] block text-neutral-500">
                                                s/d {detailBillboard.tanggal_berakhir}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Location Map Preview */}
                            <div className="rounded-xl border border-neutral-200/90 overflow-hidden dark:border-neutral-800">
                                <div className="border-b bg-neutral-50 px-3.5 py-2 text-xs font-semibold dark:bg-neutral-900 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="size-3.5 text-indigo-600" />
                                        <span>{detailBillboard.lokasi}</span>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${detailBillboard.latitude},${detailBillboard.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
                                    >
                                        Buka Google Maps
                                        <ExternalLink className="size-2.5" />
                                    </a>
                                </div>
                                <LocationPreviewMap
                                    latitude={detailBillboard.latitude}
                                    longitude={detailBillboard.longitude}
                                    popupText={detailBillboard.lokasi}
                                    height="200px"
                                    showRadius={false}
                                />
                            </div>

                            {/* Evidence Photos Grid */}
                            <div className="space-y-3">
                                <Label className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                                    Dokumentasi Evidence (4 Foto)
                                </Label>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    {PHOTO_CONFIG.map((photo) => {
                                        const url = detailBillboard[photo.urlKey];
                                        return (
                                            <div
                                                key={photo.key}
                                                className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200/90 bg-white p-2 shadow-xs transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                                            >
                                                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900">
                                                    {url ? (
                                                        <>
                                                            <img
                                                                src={url}
                                                                alt={photo.label}
                                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setPreviewImage({
                                                                        url,
                                                                        title: `${photo.label} - ${detailBillboard.lokasi}`,
                                                                    })
                                                                }
                                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-white"
                                                            >
                                                                <Maximize2 className="size-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-neutral-400">
                                                            <ImageIcon className="size-6 opacity-40 mb-1" />
                                                            <span className="text-[10px] italic">
                                                                Foto belum diunggah
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-2">
                                                    <p className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                                                        {photo.label}
                                                    </p>
                                                    <p className="text-[10px] text-neutral-500 line-clamp-1">
                                                        {photo.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Tutup
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Hapus Billboard */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="size-5" />
                            Hapus Billboard
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data billboard di{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedBillboard?.lokasi}
                            </span>
                            ? Seluruh foto evidence dan data terkait akan dihapus secara permanen.
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
                            Hapus Billboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Fullscreen Photo Lightbox Modal */}
            <Dialog open={previewImage !== null} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl p-2 bg-neutral-950 border-neutral-800 text-white">
                    <DialogHeader className="p-3 pb-1">
                        <DialogTitle className="text-sm font-semibold truncate text-white">
                            {previewImage?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {previewImage && (
                        <div className="relative flex max-h-[80vh] items-center justify-center overflow-hidden rounded-lg p-1">
                            <img
                                src={previewImage.url}
                                alt={previewImage.title}
                                className="max-h-[75vh] w-auto max-w-full rounded object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

BillboardsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
        {
            title: 'Promosi',
            href: '#',
        },
        {
            title: 'ATL',
            href: '#',
        },
        {
            title: 'Billboard',
            href: billboardsRoute.index(),
        },
    ],
};
