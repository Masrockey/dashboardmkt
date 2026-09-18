import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
import LocationPickerMap from '@/components/location-picker-map';
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
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import pameranRoute from '@/routes/pameran';
import type { Dealer, JenisPameran, PaginatedPameran, PameranItem } from '@/types';

interface PameranIndexProps {
    pamerans: PaginatedPameran;
    dealers: Dealer[];
    jenisPameranList: JenisPameran[];
    filters: {
        search?: string;
        dealer_id?: string;
        jenis_pameran_id?: string;
    };
}

export default function PameranIndex({
    pamerans,
    dealers,
    jenisPameranList,
    filters,
}: PameranIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedDealerFilter, setSelectedDealerFilter] = useState(filters.dealer_id || '');
    const [selectedJenisFilter, setSelectedJenisFilter] = useState(filters.jenis_pameran_id || '');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPameran, setSelectedPameran] = useState<PameranItem | null>(null);

    // Create Form
    const createForm = useForm({
        dealer_id: '' as string | number,
        jenis_pameran_id: '' as string | number,
        mulai_tanggal_sewa: '',
        tanggal_sewa_berakhir: '',
        kecamatan: '',
        detail_alamat: '',
        kode_pameran_ahm: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    // Edit Form
    const editForm = useForm({
        dealer_id: '' as string | number,
        jenis_pameran_id: '' as string | number,
        mulai_tanggal_sewa: '',
        tanggal_sewa_berakhir: '',
        kecamatan: '',
        detail_alamat: '',
        kode_pameran_ahm: '',
        latitude: null as number | null,
        longitude: null as number | null,
    });

    // Delete Form
    const deleteForm = useForm({});

    const selectedCreateJenis = jenisPameranList.find(
        (j) => String(j.id) === String(createForm.data.jenis_pameran_id),
    );

    const applyFilters = (
        newSearch?: string,
        newDealer?: string,
        newJenis?: string,
    ) => {
        const search = newSearch !== undefined ? newSearch : searchQuery;
        const dealer = newDealer !== undefined ? newDealer : selectedDealerFilter;
        const jenis = newJenis !== undefined ? newJenis : selectedJenisFilter;

        router.get(
            pameranRoute.index.url({
                query: {
                    search: search || undefined,
                    dealer_id: dealer || undefined,
                    jenis_pameran_id: jenis || undefined,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters(searchQuery, selectedDealerFilter, selectedJenisFilter);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedDealerFilter('');
        setSelectedJenisFilter('');
        router.get(
            pameranRoute.index.url(),
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
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(pameranRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (pameran: PameranItem) => {
        setSelectedPameran(pameran);
        // Format dates into YYYY-MM-DD for date input
        const formatForInput = (dateStr: string) => {
            if (!dateStr) return '';
            return dateStr.split('T')[0];
        };

        editForm.setData({
            dealer_id: pameran.dealer_id,
            jenis_pameran_id: pameran.jenis_pameran_id,
            mulai_tanggal_sewa: formatForInput(pameran.mulai_tanggal_sewa),
            tanggal_sewa_berakhir: formatForInput(pameran.tanggal_sewa_berakhir),
            kecamatan: pameran.kecamatan,
            detail_alamat: pameran.detail_alamat,
            kode_pameran_ahm: pameran.kode_pameran_ahm || '',
            latitude: pameran.latitude ?? null,
            longitude: pameran.longitude ?? null,
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPameran) {
            return;
        }

        editForm.put(pameranRoute.update.url(selectedPameran.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedPameran(null);
            },
        });
    };

    const handleOpenDelete = (pameran: PameranItem) => {
        setSelectedPameran(pameran);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPameran) {
            return;
        }

        deleteForm.delete(pameranRoute.destroy.url(selectedPameran.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedPameran(null);
            },
        });
    };

    // Calculate rental status
    const getRentalStatus = (startDateStr: string, endDateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const start = new Date(startDateStr);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999);

        if (today >= start && today <= end) {
            return (
                <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Aktif / Berjalan
                </Badge>
            );
        }

        if (today < start) {
            return (
                <Badge className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    Akan Datang
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="text-neutral-500 dark:text-neutral-400">
                Selesai
            </Badge>
        );
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const isFiltered =
        searchQuery !== '' || selectedDealerFilter !== '' || selectedJenisFilter !== '';

    return (
        <>
            <Head title="Pameran" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Menu Pameran
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola jadwal pameran, dealer, periode sewa, dan lokasi pameran.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
                        <Plus className="size-4" />
                        Tambah Pameran
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Cari dealer, pameran, kecamatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    applyFilters('', selectedDealerFilter, selectedJenisFilter);
                                }}
                                className="text-muted-foreground hover:text-foreground absolute right-3"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Dealer Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">Dealer:</span>
                            <Select
                                value={selectedDealerFilter ? String(selectedDealerFilter) : 'all'}
                                onValueChange={(val) => {
                                    const nextVal = val === 'all' ? '' : val;
                                    setSelectedDealerFilter(nextVal);
                                    applyFilters(searchQuery, nextVal, selectedJenisFilter);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[170px] text-xs">
                                    <SelectValue placeholder="Semua Dealer" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Dealer</SelectItem>
                                    {dealers.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>
                                            {d.nama_dealer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Jenis Pameran Filter */}
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">Jenis:</span>
                            <Select
                                value={selectedJenisFilter ? String(selectedJenisFilter) : 'all'}
                                onValueChange={(val) => {
                                    const nextVal = val === 'all' ? '' : val;
                                    setSelectedJenisFilter(nextVal);
                                    applyFilters(searchQuery, selectedDealerFilter, nextVal);
                                }}
                            >
                                <SelectTrigger className="h-9 w-[160px] text-xs">
                                    <SelectValue placeholder="Semua Jenis" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Jenis</SelectItem>
                                    {jenisPameranList.map((j) => (
                                        <SelectItem key={j.id} value={String(j.id)}>
                                            {j.jenis_pameran}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {isFiltered && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 px-2.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                            >
                                Reset
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table Data View */}
                <Card className="overflow-hidden py-0 shadow-xs border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">No</TableHead>
                                <TableHead>Kode Pameran</TableHead>
                                <TableHead>Nama Dealer</TableHead>
                                <TableHead>Jenis Pameran</TableHead>
                                <TableHead>Periode Sewa</TableHead>
                                <TableHead>Lokasi</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pamerans.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                                                <CalendarDays className="size-6 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Belum ada data pameran
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {isFiltered
                                                    ? 'Tidak ditemukan data dengan filter pencarian tersebut.'
                                                    : 'Mulai dengan menambahkan jadwal pameran pertama.'}
                                            </p>
                                            {!isFiltered && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah Pameran
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pamerans.data.map((item, index) => {
                                    const rowNumber =
                                        ((pamerans.current_page - 1) * pamerans.per_page) +
                                        index +
                                        1;

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">MD:</span>
                                                        <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {item.kode_pameran_md}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">AHM:</span>
                                                        {item.kode_pameran_ahm ? (
                                                            <span className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                                                {item.kode_pameran_ahm}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs italic text-neutral-400">
                                                                -
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {item.dealer?.nama_dealer || '-'}
                                                    </span>
                                                    <Badge variant="outline" className="w-fit font-mono text-[11px] py-0">
                                                        {item.dealer?.kode_dealer}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {item.jenis_pameran?.icon_map_url ? (
                                                        <div className="flex size-7 items-center justify-center rounded border bg-neutral-50 p-0.5 dark:bg-neutral-900 shrink-0">
                                                            <img
                                                                src={item.jenis_pameran.icon_map_url}
                                                                alt={item.jenis_pameran.jenis_pameran}
                                                                className="size-5 object-contain"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <MapPin className="size-4 text-neutral-400 shrink-0" />
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {item.jenis_pameran?.jenis_pameran || '-'}
                                                        </span>
                                                        <span className="font-mono text-xs text-neutral-400">
                                                            {item.jenis_pameran?.kode_pameran}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                                                        <Calendar className="size-3.5 text-neutral-400 shrink-0" />
                                                        <span>
                                                            {formatDate(item.mulai_tanggal_sewa)} s/d{' '}
                                                            {formatDate(item.tanggal_sewa_berakhir)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        {getRentalStatus(
                                                            item.mulai_tanggal_sewa,
                                                            item.tanggal_sewa_berakhir,
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col max-w-xs">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                                                        <MapPin className="size-3.5 text-neutral-500 shrink-0" />
                                                        {item.kecamatan}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                        {item.detail_alamat}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        title="Edit Pameran"
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                        title="Hapus Pameran"
                                                    >
                                                        <Trash2 className="size-4" />
                                                        <span className="sr-only">Hapus</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {pamerans.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{pamerans.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{pamerans.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{pamerans.total}</span> data pameran
                            </p>

                            <div className="flex items-center gap-1">
                                {pamerans.prev_page_url ? (
                                    <Link
                                        href={pamerans.prev_page_url}
                                        preserveScroll
                                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        <ChevronLeft className="size-3.5" />
                                        Sebelumnya
                                    </Link>
                                ) : (
                                    <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50 dark:border-neutral-800">
                                        <ChevronLeft className="size-3.5" />
                                        Sebelumnya
                                    </span>
                                )}

                                {pamerans.next_page_url ? (
                                    <Link
                                        href={pamerans.next_page_url}
                                        preserveScroll
                                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Berikutnya
                                        <ChevronRight className="size-3.5" />
                                    </Link>
                                ) : (
                                    <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50 dark:border-neutral-800">
                                        Berikutnya
                                        <ChevronRight className="size-3.5" />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialog Tambah Pameran */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Pameran</DialogTitle>
                            <DialogDescription>
                                Pilih Dealer dan Jenis Pameran, lalu tentukan periode sewa dan detail lokasi.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                        Kode Pameran MD:
                                    </span>
                                    <span className="font-mono text-neutral-600 dark:text-neutral-300 font-medium">
                                        {selectedCreateJenis
                                            ? `[Otomatis: ${selectedCreateJenis.kode_pameran}-YYYYMMDD-XXXX]`
                                            : '[Otomatis: [kode pameran]-YYYYMMDD-XXXX]'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="create_kode_pameran_ahm">Kode Pameran AHM</Label>
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">Opsional (Manual Admin)</span>
                                </div>
                                <Input
                                    id="create_kode_pameran_ahm"
                                    placeholder="Contoh: AHM-EXH-2026-001"
                                    value={createForm.data.kode_pameran_ahm}
                                    onChange={(e) => createForm.setData('kode_pameran_ahm', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.kode_pameran_ahm} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_dealer_id">Nama Dealer</Label>
                                <Select
                                    value={createForm.data.dealer_id ? String(createForm.data.dealer_id) : undefined}
                                    onValueChange={(val) => createForm.setData('dealer_id', val)}
                                    disabled={createForm.processing}
                                >
                                    <SelectTrigger id="create_dealer_id" className="w-full">
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

                            <div className="space-y-1.5">
                                <Label htmlFor="create_jenis_pameran_id">Jenis Pameran</Label>
                                <Select
                                    value={createForm.data.jenis_pameran_id ? String(createForm.data.jenis_pameran_id) : undefined}
                                    onValueChange={(val) => createForm.setData('jenis_pameran_id', val)}
                                    disabled={createForm.processing}
                                >
                                    <SelectTrigger id="create_jenis_pameran_id" className="w-full">
                                        <SelectValue placeholder="-- Pilih Jenis Pameran --" />
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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_mulai_tanggal_sewa">Mulai Tanggal Sewa</Label>
                                    <Input
                                        id="create_mulai_tanggal_sewa"
                                        type="date"
                                        value={createForm.data.mulai_tanggal_sewa}
                                        onChange={(e) => createForm.setData('mulai_tanggal_sewa', e.target.value)}
                                        disabled={createForm.processing}
                                    />
                                    <InputError message={createForm.errors.mulai_tanggal_sewa} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_tanggal_sewa_berakhir">Tanggal Sewa Berakhir</Label>
                                    <Input
                                        id="create_tanggal_sewa_berakhir"
                                        type="date"
                                        value={createForm.data.tanggal_sewa_berakhir}
                                        onChange={(e) => createForm.setData('tanggal_sewa_berakhir', e.target.value)}
                                        disabled={createForm.processing}
                                    />
                                    <InputError message={createForm.errors.tanggal_sewa_berakhir} />
                                </div>
                            </div>

                            {/* Peta Interaktif untuk Pilih Titik Lokasi */}
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
                                <LocationPickerMap
                                    initialLat={createForm.data.latitude}
                                    initialLng={createForm.data.longitude}
                                    onLocationSelect={(res) => {
                                        createForm.setData((prev) => ({
                                            ...prev,
                                            kecamatan: res.kecamatan || prev.kecamatan,
                                            detail_alamat: res.detailAlamat || prev.detail_alamat,
                                            latitude: res.latitude,
                                            longitude: res.longitude,
                                        }));
                                    }}
                                    height="220px"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_kecamatan">Kecamatan</Label>
                                <Input
                                    id="create_kecamatan"
                                    placeholder="Contoh: Mataram / Cakranegara"
                                    value={createForm.data.kecamatan}
                                    onChange={(e) => createForm.setData('kecamatan', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.kecamatan} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_detail_alamat">Detail Alamat</Label>
                                <Textarea
                                    id="create_detail_alamat"
                                    rows={3}
                                    placeholder="Contoh: Depan pintu masuk utama Mall, sebelah barat lobby..."
                                    value={createForm.data.detail_alamat}
                                    onChange={(e) => createForm.setData('detail_alamat', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.detail_alamat} />
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={createForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Pameran
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Pameran */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Pameran</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi dealer, jenis pameran, tanggal sewa, atau lokasi pameran.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kode_pameran_md">Kode Pameran MD</Label>
                                <Input
                                    id="edit_kode_pameran_md"
                                    value={selectedPameran?.kode_pameran_md || ''}
                                    disabled
                                    className="bg-neutral-100 font-mono text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400 cursor-not-allowed"
                                />
                                <p className="text-[11px] text-neutral-400">
                                    Kode pameran MD dibuat otomatis saat pameran dibuat ([kode pameran]-YYYYMMDD-XXXX) dan tidak dapat diubah.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit_kode_pameran_ahm">Kode Pameran AHM</Label>
                                    <span className="text-xs text-neutral-400 dark:text-neutral-500">Opsional (Manual Admin)</span>
                                </div>
                                <Input
                                    id="edit_kode_pameran_ahm"
                                    placeholder="Contoh: AHM-EXH-2026-001"
                                    value={editForm.data.kode_pameran_ahm}
                                    onChange={(e) => editForm.setData('kode_pameran_ahm', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.kode_pameran_ahm} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_dealer_id">Nama Dealer</Label>
                                <Select
                                    value={editForm.data.dealer_id ? String(editForm.data.dealer_id) : undefined}
                                    onValueChange={(val) => editForm.setData('dealer_id', val)}
                                    disabled={editForm.processing}
                                >
                                    <SelectTrigger id="edit_dealer_id" className="w-full">
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
                                <InputError message={editForm.errors.dealer_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_jenis_pameran_id">Jenis Pameran</Label>
                                <Select
                                    value={editForm.data.jenis_pameran_id ? String(editForm.data.jenis_pameran_id) : undefined}
                                    onValueChange={(val) => editForm.setData('jenis_pameran_id', val)}
                                    disabled={editForm.processing}
                                >
                                    <SelectTrigger id="edit_jenis_pameran_id" className="w-full">
                                        <SelectValue placeholder="-- Pilih Jenis Pameran --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {jenisPameranList.map((j) => (
                                            <SelectItem key={j.id} value={String(j.id)}>
                                                [{j.kode_pameran}] {j.jenis_pameran}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.jenis_pameran_id} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_mulai_tanggal_sewa">Mulai Tanggal Sewa</Label>
                                    <Input
                                        id="edit_mulai_tanggal_sewa"
                                        type="date"
                                        value={editForm.data.mulai_tanggal_sewa}
                                        onChange={(e) => editForm.setData('mulai_tanggal_sewa', e.target.value)}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={editForm.errors.mulai_tanggal_sewa} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_tanggal_sewa_berakhir">Tanggal Sewa Berakhir</Label>
                                    <Input
                                        id="edit_tanggal_sewa_berakhir"
                                        type="date"
                                        value={editForm.data.tanggal_sewa_berakhir}
                                        onChange={(e) => editForm.setData('tanggal_sewa_berakhir', e.target.value)}
                                        disabled={editForm.processing}
                                    />
                                    <InputError message={editForm.errors.tanggal_sewa_berakhir} />
                                </div>
                            </div>

                            {/* Peta Interaktif untuk Pilih Titik Lokasi */}
                            <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 dark:border-neutral-800 dark:bg-neutral-900/40">
                                <LocationPickerMap
                                    key={selectedPameran?.id ?? 'edit-map'}
                                    initialLat={editForm.data.latitude}
                                    initialLng={editForm.data.longitude}
                                    onLocationSelect={(res) => {
                                        editForm.setData((prev) => ({
                                            ...prev,
                                            kecamatan: res.kecamatan || prev.kecamatan,
                                            detail_alamat: res.detailAlamat || prev.detail_alamat,
                                            latitude: res.latitude,
                                            longitude: res.longitude,
                                        }));
                                    }}
                                    height="220px"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kecamatan">Kecamatan</Label>
                                <Input
                                    id="edit_kecamatan"
                                    value={editForm.data.kecamatan}
                                    onChange={(e) => editForm.setData('kecamatan', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.kecamatan} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_detail_alamat">Detail Alamat</Label>
                                <Textarea
                                    id="edit_detail_alamat"
                                    rows={3}
                                    value={editForm.data.detail_alamat}
                                    onChange={(e) => editForm.setData('detail_alamat', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.detail_alamat} />
                            </div>
                        </div>

                        <DialogFooter>
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

            {/* Dialog Konfirmasi Hapus */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Pameran</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data pameran di{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedPameran?.kecamatan} ({selectedPameran?.dealer?.nama_dealer})
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
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

PameranIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Pameran',
            href: pameranRoute.index(),
        },
    ],
};

