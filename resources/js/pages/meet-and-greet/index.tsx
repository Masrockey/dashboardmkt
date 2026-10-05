import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Handshake,
    IdCard,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Search,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { MotorcycleCombobox } from '@/components/motorcycle-combobox';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
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
import type { Dealer, MeetAndGreetItem, PaginatedMeetAndGreets } from '@/types';

export const DEALER_ASAL_OPTIONS = [
    'Krida Mataram',
    'SPS Mataram',
    'Daya Motor Bertais',
    'SO Brawijaya',
    'MPM',
    'SO Ampenan',
    'SO Sriwijaya',
    'SO Gerung',
    'TDM Mataram',
    'Daya Selaparang',
    'FIF Mataram',
] as const;

interface MeetAndGreetIndexProps {
    meetAndGreets: PaginatedMeetAndGreets;
    dealers?: string[] | Dealer[];
    dealerOptions?: string[];
    motorcycleTypes: string[];
    isRegistrationOpen?: boolean;
    canToggleRegistration?: boolean;
    filters: {
        search?: string;
        dealer_id?: string;
        dealer_asal?: string;
    };
}

export default function MeetAndGreetIndex({
    meetAndGreets,
    dealers,
    dealerOptions,
    motorcycleTypes,
    isRegistrationOpen = true,
    canToggleRegistration = true,
    filters,
}: MeetAndGreetIndexProps) {
    const availableDealerOptions: readonly string[] =
        dealerOptions && dealerOptions.length > 0
            ? dealerOptions
            : Array.isArray(dealers) && dealers.length > 0 && typeof dealers[0] === 'string'
                ? (dealers as unknown as string[])
                : DEALER_ASAL_OPTIONS;
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
    const isDealerUser = currentUser.role === 'dealer';

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedDealerFilter, setSelectedDealerFilter] = useState(
        filters.dealer_asal || filters.dealer_id || 'all',
    );
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MeetAndGreetItem | null>(null);
    const [previewStnkModal, setPreviewStnkModal] = useState<MeetAndGreetItem | null>(null);

    // File preview local URL for Create & Edit
    const [createStnkPreview, setCreateStnkPreview] = useState<string | null>(null);
    const [createStnkFileName, setCreateStnkFileName] = useState<string | null>(null);
    const [editStnkPreview, setEditStnkPreview] = useState<string | null>(null);
    const [editStnkFileName, setEditStnkFileName] = useState<string | null>(null);
    const [isTogglingRegistration, setIsTogglingRegistration] = useState(false);

    const handleToggleRegistration = (checked: boolean) => {
        setIsTogglingRegistration(true);
        router.post(
            '/meet-and-greet/toggle-status',
            { is_open: checked },
            {
                preserveScroll: true,
                onFinish: () => setIsTogglingRegistration(false),
            },
        );
    };

    // Create Form
    const createForm = useForm<{
        dealer_asal: string;
        dealer_id: string;
        nama_konsumen: string;
        alamat: string;
        no_hp: string;
        tipe_motor: string;
        no_plat: string;
        stnk: File | null;
    }>({
        dealer_asal: '',
        dealer_id: isDealerUser && currentUser.dealer_id ? String(currentUser.dealer_id) : '',
        nama_konsumen: '',
        alamat: '',
        no_hp: '',
        tipe_motor: '',
        no_plat: '',
        stnk: null,
    });

    // Edit Form
    const editForm = useForm<{
        _method: string;
        dealer_asal: string;
        dealer_id: string;
        nama_konsumen: string;
        alamat: string;
        no_hp: string;
        tipe_motor: string;
        no_plat: string;
        stnk: File | null;
    }>({
        _method: 'PUT',
        dealer_asal: '',
        dealer_id: '',
        nama_konsumen: '',
        alamat: '',
        no_hp: '',
        tipe_motor: '',
        no_plat: '',
        stnk: null,
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/meet-and-greet',
            {
                search: searchQuery || undefined,
                dealer_asal: selectedDealerFilter !== 'all' ? selectedDealerFilter : undefined,
                dealer_id: selectedDealerFilter !== 'all' ? selectedDealerFilter : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetSearch = () => {
        setSearchQuery('');
        setSelectedDealerFilter('all');
        router.get(
            '/meet-and-greet',
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
        if (isDealerUser && currentUser.dealer_id) {
            createForm.setData('dealer_id', String(currentUser.dealer_id));
        }
        setCreateStnkPreview(null);
        setCreateStnkFileName(null);
        setIsCreateOpen(true);
    };

    const handleCreateFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        createForm.setData('stnk', file);
        if (file) {
            setCreateStnkFileName(file.name);
            if (file.type.startsWith('image/')) {
                setCreateStnkPreview(URL.createObjectURL(file));
            } else {
                setCreateStnkPreview(null);
            }
        } else {
            setCreateStnkFileName(null);
            setCreateStnkPreview(null);
        }
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/meet-and-greet', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreateStnkPreview(null);
                setCreateStnkFileName(null);
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (item: MeetAndGreetItem) => {
        setSelectedItem(item);
        editForm.setData({
            _method: 'PUT',
            dealer_asal: item.dealer_asal || item.dealer?.nama_dealer || '',
            dealer_id: item.dealer_id ? String(item.dealer_id) : '',
            nama_konsumen: item.nama_konsumen,
            alamat: item.alamat,
            no_hp: item.no_hp,
            tipe_motor: item.tipe_motor,
            no_plat: item.no_plat,
            stnk: null,
        });
        editForm.clearErrors();
        setEditStnkPreview(null);
        setEditStnkFileName(null);
        setIsEditOpen(true);
    };

    const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        editForm.setData('stnk', file);
        if (file) {
            setEditStnkFileName(file.name);
            if (file.type.startsWith('image/')) {
                setEditStnkPreview(URL.createObjectURL(file));
            } else {
                setEditStnkPreview(null);
            }
        } else {
            setEditStnkFileName(null);
            setEditStnkPreview(null);
        }
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        editForm.post(`/meet-and-greet/${selectedItem.id}`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                editForm.reset();
                setEditStnkPreview(null);
                setEditStnkFileName(null);
                setIsEditOpen(false);
            },
        });
    };

    const handleOpenDelete = (item: MeetAndGreetItem) => {
        setSelectedItem(item);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedItem) return;

        deleteForm.delete(`/meet-and-greet/${selectedItem.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedItem(null);
            },
        });
    };

    const formatDateIndo = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedDealerFilter && selectedDealerFilter !== 'all') {
            params.append('dealer_asal', selectedDealerFilter);
        }
        const qs = params.toString();
        window.location.href = `/meet-and-greet/export${qs ? `?${qs}` : ''}`;
    };

    return (
        <>
            <Head title="Meet & Greet" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                Meet & Greet
                            </h1>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                                PCD Activity
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola data konsumen Meet & Greet, informasi kendaraan, dan berkas STNK.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                        {canToggleRegistration && (
                            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex flex-col text-left">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Form Publik
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span
                                            className={`inline-block size-2 rounded-full ${
                                                isRegistrationOpen
                                                    ? 'bg-emerald-500 animate-pulse'
                                                    : 'bg-rose-500'
                                            }`}
                                        />
                                        <span
                                            className={`text-xs font-bold ${
                                                isRegistrationOpen
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : 'text-rose-700 dark:text-rose-400'
                                            }`}
                                        >
                                            {isRegistrationOpen ? 'Dibuka (ON)' : 'Ditutup (OFF)'}
                                        </span>
                                    </div>
                                </div>
                                <Switch
                                    checked={isRegistrationOpen}
                                    onCheckedChange={handleToggleRegistration}
                                    disabled={isTogglingRegistration}
                                    title={
                                        isRegistrationOpen
                                            ? 'Pendaftaran sedang ON (publik bisa isi form). Klik untuk mengubah ke OFF'
                                            : 'Pendaftaran sedang OFF (publik tidak bisa isi form). Klik untuk mengubah ke ON'
                                    }
                                />
                                <a
                                    href="/meetngreethonda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                                    title="Buka Form Publik (Tab Baru)"
                                >
                                    <ExternalLink className="size-3.5" />
                                </a>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleExportExcel}
                            className="gap-2 shadow-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                        >
                            <Download className="size-4 text-emerald-600 dark:text-emerald-400" />
                            Export Excel (.xlsx)
                        </Button>
                        <Button onClick={handleOpenCreate} className="gap-2 shadow-xs">
                            <Plus className="size-4" />
                            Tambah Konsumen
                        </Button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-md items-center">
                        <Search className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                        <Input
                            type="text"
                            placeholder="Cari Konsumen, No Plat, No HP, Tipe Motor..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9 shadow-xs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="text-muted-foreground hover:text-foreground absolute right-3"
                                title="Reset pencarian"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    {!isDealerUser && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                Filter Dealer:
                            </span>
                            <Select
                                value={selectedDealerFilter}
                                onValueChange={(val) => {
                                    setSelectedDealerFilter(val);
                                    router.get(
                                        '/meet-and-greet',
                                        {
                                            search: searchQuery || undefined,
                                            dealer_asal: val !== 'all' ? val : undefined,
                                            dealer_id: val !== 'all' ? val : undefined,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                            >
                                <SelectTrigger className="w-[200px] h-9 text-xs">
                                    <SelectValue placeholder="Semua Dealer Asal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Dealer Asal</SelectItem>
                                    {availableDealerOptions.map((d) => (
                                        <SelectItem key={d} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Table Data Card */}
                <Card className="overflow-hidden py-0 shadow-xs border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-neutral-50/70 dark:bg-neutral-900/50">
                                <TableHead className="w-12 text-center font-semibold">No</TableHead>
                                <TableHead className="font-semibold">No Registrasi</TableHead>
                                <TableHead className="font-semibold">Nama Dealer Asal</TableHead>
                                <TableHead className="font-semibold">Nama Konsumen (ID)</TableHead>
                                <TableHead className="font-semibold">Kontak & Alamat</TableHead>
                                <TableHead className="font-semibold">Tipe Motor</TableHead>
                                <TableHead className="font-semibold">No Plat</TableHead>
                                <TableHead className="text-center font-semibold">Berkas STNK</TableHead>
                                <TableHead className="font-semibold">Waktu Input</TableHead>
                                <TableHead className="text-right font-semibold">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {meetAndGreets.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="py-14 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-neutral-100 p-3.5 dark:bg-neutral-800">
                                                <Handshake className="size-6 text-neutral-400 dark:text-neutral-500" />
                                            </div>
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                Belum Ada Data Meet & Greet
                                            </p>
                                            <p className="text-xs text-neutral-500 max-w-sm">
                                                {searchQuery
                                                    ? 'Tidak ada data konsumen yang sesuai dengan kata kunci pencarian Anda.'
                                                    : 'Tambahkan data konsumen Meet & Greet baru dengan mengklik tombol Tambah Konsumen di atas.'}
                                            </p>
                                            {searchQuery ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleResetSearch}
                                                    className="mt-2"
                                                >
                                                    Reset Pencarian
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah Konsumen Pertama
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                meetAndGreets.data.map((item, index) => {
                                    const rowNumber =
                                        (meetAndGreets.current_page - 1) * meetAndGreets.per_page + index + 1;

                                    return (
                                        <TableRow key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30">
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>

                                            {/* No Registrasi */}
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="font-mono text-xs font-semibold bg-neutral-50 text-neutral-900 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700"
                                                >
                                                    {item.no_registrasi || '-'}
                                                </Badge>
                                            </TableCell>

                                            {/* Nama Dealer Asal */}
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                                        {item.dealer_asal || item.dealer?.nama_dealer || '-'}
                                                    </span>
                                                    {item.dealer?.kode_dealer && (
                                                        <span className="font-mono text-xs text-neutral-500">
                                                            Kode: {item.dealer.kode_dealer}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Nama Konsumen */}
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                        {item.nama_konsumen.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {item.nama_konsumen}
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                                                            <IdCard className="size-3" /> Sesuai ID/KTP
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Kontak & Alamat */}
                                            <TableCell>
                                                <div className="space-y-1 max-w-[240px]">
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                                        <Phone className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                        <span>{item.no_hp}</span>
                                                    </div>
                                                    <div className="flex items-start gap-1.5 text-xs text-neutral-500 line-clamp-2">
                                                        <MapPin className="size-3 text-red-500 shrink-0 mt-0.5" />
                                                        <span>{item.alamat}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Tipe Motor */}
                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                    {item.tipe_motor}
                                                </span>
                                            </TableCell>

                                            {/* No Plat */}
                                            <TableCell>
                                                <span className="inline-flex items-center rounded border border-neutral-300 bg-neutral-900 px-2 py-0.5 font-mono text-xs font-bold text-white shadow-xs dark:border-neutral-700">
                                                    {item.no_plat}
                                                </span>
                                            </TableCell>

                                            {/* Berkas STNK */}
                                            <TableCell className="text-center">
                                                {item.stnk_url ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPreviewStnkModal(item)}
                                                        className="h-8 gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                    >
                                                        <Eye className="size-3.5" />
                                                        Lihat STNK
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 italic">
                                                        Tidak ada file
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* Waktu Input */}
                                            <TableCell>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                    {formatDateIndo(item.created_at)}
                                                </div>
                                            </TableCell>

                                            {/* Aksi */}
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        title="Edit Data Konsumen"
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                        title="Hapus Data Konsumen"
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
                    {meetAndGreets.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{meetAndGreets.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{meetAndGreets.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{meetAndGreets.total}</span> konsumen
                            </p>

                            <div className="flex items-center gap-1">
                                {meetAndGreets.prev_page_url ? (
                                    <Link
                                        href={meetAndGreets.prev_page_url}
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

                                {meetAndGreets.next_page_url ? (
                                    <Link
                                        href={meetAndGreets.next_page_url}
                                        preserveScroll
                                        className="inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Selanjutnya
                                        <ChevronRight className="size-3.5" />
                                    </Link>
                                ) : (
                                    <span className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50 dark:border-neutral-800">
                                        Selanjutnya
                                        <ChevronRight className="size-3.5" />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Dialog Tambah Data Meet & Greet */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Handshake className="size-5 text-primary" />
                            Tambah Data Konsumen Meet & Greet
                        </DialogTitle>
                        <DialogDescription>
                            Isi detail konsumen, kendaraan, dan lampirkan berkas foto atau dokumen STNK.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                        {/* Info No Registrasi Otomatis */}
                        <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                            <span>No. Registrasi:</span>
                            <span className="font-mono font-semibold italic text-neutral-500">
                                (Otomatis dibuat sistem saat disimpan)
                            </span>
                        </div>
                        {/* Nama Dealer Asal */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create_dealer_asal">
                                Nama Dealer Asal <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={createForm.data.dealer_asal}
                                onValueChange={(val) => createForm.setData('dealer_asal', val)}
                                disabled={createForm.processing}
                            >
                                <SelectTrigger id="create_dealer_asal" className="w-full">
                                    <SelectValue placeholder="-- Pilih Dealer Asal --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDealerOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={createForm.errors.dealer_asal || createForm.errors.dealer_id} />
                        </div>

                        {/* Nama Konsumen Sesuai ID */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create_nama_konsumen">
                                Nama Konsumen sesuai ID <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="create_nama_konsumen"
                                placeholder="Contoh: Budi Santoso"
                                value={createForm.data.nama_konsumen}
                                onChange={(e) => createForm.setData('nama_konsumen', e.target.value)}
                                disabled={createForm.processing}
                            />
                            <InputError message={createForm.errors.nama_konsumen} />
                        </div>

                        {/* No HP */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create_no_hp">
                                Nomor HP <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="create_no_hp"
                                type="tel"
                                placeholder="Contoh: 081234567890"
                                value={createForm.data.no_hp}
                                onChange={(e) => createForm.setData('no_hp', e.target.value)}
                                disabled={createForm.processing}
                            />
                            <InputError message={createForm.errors.no_hp} />
                        </div>

                        {/* Alamat */}
                        <div className="space-y-1.5">
                            <Label htmlFor="create_alamat">
                                Alamat <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="create_alamat"
                                rows={2}
                                placeholder="Contoh: Jl. Pejanggik No. 12, Mataram"
                                value={createForm.data.alamat}
                                onChange={(e) => createForm.setData('alamat', e.target.value)}
                                disabled={createForm.processing}
                            />
                            <InputError message={createForm.errors.alamat} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Tipe Motor */}
                            <div className="space-y-1.5">
                                <Label htmlFor="create_tipe_motor">
                                    Tipe Motor <span className="text-red-500">*</span>
                                </Label>
                                <MotorcycleCombobox
                                    id="create_tipe_motor"
                                    value={createForm.data.tipe_motor}
                                    onChange={(val) => createForm.setData('tipe_motor', val)}
                                    options={motorcycleTypes}
                                    placeholder="Pilih atau cari tipe Honda..."
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.tipe_motor} />
                            </div>

                            {/* No Plat */}
                            <div className="space-y-1.5">
                                <Label htmlFor="create_no_plat">
                                    Nomor Plat <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="create_no_plat"
                                    placeholder="Contoh: DR 1234 AB"
                                    value={createForm.data.no_plat}
                                    onChange={(e) => createForm.setData('no_plat', e.target.value.toUpperCase())}
                                    disabled={createForm.processing}
                                    className="font-mono uppercase"
                                />
                                <InputError message={createForm.errors.no_plat} />
                            </div>
                        </div>

                        {/* Upload STNK */}
                        <div className="space-y-1.5 pt-1">
                            <Label htmlFor="create_stnk">
                                Upload STNK <span className="text-red-500">*</span>
                            </Label>
                            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-neutral-300 px-6 py-5 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30">
                                <div className="text-center">
                                    <UploadCloud className="mx-auto size-9 text-neutral-400" />
                                    <div className="mt-2 flex text-sm leading-6 text-neutral-600 dark:text-neutral-400">
                                        <label
                                            htmlFor="create_stnk"
                                            className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:underline"
                                        >
                                            <span>Unggah berkas STNK</span>
                                            <input
                                                id="create_stnk"
                                                name="stnk"
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                                className="sr-only"
                                                onChange={handleCreateFileChange}
                                                disabled={createForm.processing}
                                            />
                                        </label>
                                        <p className="pl-1">atau seret ke sini</p>
                                    </div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        PNG, JPG, WEBP, atau PDF hingga 5MB
                                    </p>
                                    {createStnkFileName && (
                                        <div className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                            <FileText className="size-3.5" />
                                            {createStnkFileName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {createStnkPreview && (
                                <div className="mt-2 flex items-center justify-center">
                                    <img
                                        src={createStnkPreview}
                                        alt="Preview STNK"
                                        className="max-h-48 rounded border border-neutral-200 object-contain shadow-xs dark:border-neutral-800"
                                    />
                                </div>
                            )}
                            <InputError message={createForm.errors.stnk} />
                        </div>

                        <DialogFooter className="pt-4">
                            <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={createForm.processing}>
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Konsumen
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Data Meet & Greet */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="size-5 text-primary" />
                            Ubah Data Konsumen Meet & Greet
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui informasi konsumen, nomor kendaraan, atau lampiran STNK.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        {/* Info No Registrasi */}
                        {selectedItem?.no_registrasi && (
                            <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/50">
                                <span className="font-medium text-neutral-600 dark:text-neutral-400">No. Registrasi:</span>
                                <Badge variant="outline" className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                    {selectedItem.no_registrasi}
                                </Badge>
                            </div>
                        )}
                        {/* Nama Dealer Asal */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_dealer_asal">
                                Nama Dealer Asal <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={editForm.data.dealer_asal}
                                onValueChange={(val) => editForm.setData('dealer_asal', val)}
                                disabled={editForm.processing}
                            >
                                <SelectTrigger id="edit_dealer_asal" className="w-full">
                                    <SelectValue placeholder="-- Pilih Dealer Asal --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDealerOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={editForm.errors.dealer_asal || editForm.errors.dealer_id} />
                        </div>

                        {/* Nama Konsumen Sesuai ID */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_nama_konsumen">
                                Nama Konsumen sesuai ID <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_nama_konsumen"
                                value={editForm.data.nama_konsumen}
                                onChange={(e) => editForm.setData('nama_konsumen', e.target.value)}
                                disabled={editForm.processing}
                            />
                            <InputError message={editForm.errors.nama_konsumen} />
                        </div>

                        {/* No HP */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_no_hp">
                                Nomor HP <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit_no_hp"
                                type="tel"
                                value={editForm.data.no_hp}
                                onChange={(e) => editForm.setData('no_hp', e.target.value)}
                                disabled={editForm.processing}
                            />
                            <InputError message={editForm.errors.no_hp} />
                        </div>

                        {/* Alamat */}
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_alamat">
                                Alamat <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="edit_alamat"
                                rows={2}
                                value={editForm.data.alamat}
                                onChange={(e) => editForm.setData('alamat', e.target.value)}
                                disabled={editForm.processing}
                            />
                            <InputError message={editForm.errors.alamat} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Tipe Motor */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_tipe_motor">
                                    Tipe Motor <span className="text-red-500">*</span>
                                </Label>
                                <MotorcycleCombobox
                                    id="edit_tipe_motor"
                                    value={editForm.data.tipe_motor}
                                    onChange={(val) => editForm.setData('tipe_motor', val)}
                                    options={motorcycleTypes}
                                    placeholder="Pilih atau cari tipe Honda..."
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.tipe_motor} />
                            </div>

                            {/* No Plat */}
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_no_plat">
                                    Nomor Plat <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="edit_no_plat"
                                    value={editForm.data.no_plat}
                                    onChange={(e) => editForm.setData('no_plat', e.target.value.toUpperCase())}
                                    disabled={editForm.processing}
                                    className="font-mono uppercase"
                                />
                                <InputError message={editForm.errors.no_plat} />
                            </div>
                        </div>

                        {/* Ganti STNK */}
                        <div className="space-y-1.5 pt-1">
                            <Label htmlFor="edit_stnk">
                                Ganti Berkas STNK (Opsional)
                            </Label>
                            {selectedItem?.stnk_url && !editStnkPreview && (
                                <div className="mb-2 flex items-center justify-between rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <FileText className="size-3.5 text-blue-500" />
                                        STNK Saat Ini Tersedia
                                    </span>
                                    <a
                                        href={selectedItem.stnk_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        Buka File <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            )}

                            <div className="mt-1 flex justify-center rounded-lg border border-dashed border-neutral-300 px-6 py-4 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/30">
                                <div className="text-center">
                                    <UploadCloud className="mx-auto size-7 text-neutral-400" />
                                    <div className="mt-1.5 flex text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                                        <label
                                            htmlFor="edit_stnk"
                                            className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none hover:underline"
                                        >
                                            <span>Pilih berkas baru</span>
                                            <input
                                                id="edit_stnk"
                                                name="stnk"
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                                className="sr-only"
                                                onChange={handleEditFileChange}
                                                disabled={editForm.processing}
                                            />
                                        </label>
                                        <p className="pl-1">jika ingin mengganti</p>
                                    </div>
                                    {editStnkFileName && (
                                        <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                            <FileText className="size-3.5" />
                                            {editStnkFileName}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {editStnkPreview && (
                                <div className="mt-2 flex items-center justify-center">
                                    <img
                                        src={editStnkPreview}
                                        alt="Preview STNK Baru"
                                        className="max-h-40 rounded border border-neutral-200 object-contain shadow-xs dark:border-neutral-800"
                                    />
                                </div>
                            )}
                            <InputError message={editForm.errors.stnk} />
                        </div>

                        <DialogFooter className="pt-4">
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

            {/* Dialog Preview Berkas STNK */}
            <Dialog open={!!previewStnkModal} onOpenChange={(open) => !open && setPreviewStnkModal(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="size-5 text-primary" />
                            Berkas STNK - {previewStnkModal?.nama_konsumen}
                        </DialogTitle>
                        <DialogDescription>
                            Kendaraan: {previewStnkModal?.tipe_motor} ({previewStnkModal?.no_plat}) &bull; Dealer: {previewStnkModal?.dealer?.nama_dealer}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-3 flex flex-col items-center justify-center">
                        {previewStnkModal?.stnk_url ? (
                            previewStnkModal.stnk_url.toLowerCase().endsWith('.pdf') ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-10">
                                    <FileText className="size-16 text-red-500" />
                                    <p className="text-sm font-semibold">Dokumen STNK Berformat PDF</p>
                                    <Button asChild variant="outline">
                                        <a
                                            href={previewStnkModal.stnk_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="gap-2"
                                        >
                                            <ExternalLink className="size-4" />
                                            Buka Dokumen PDF di Tab Baru
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-900/5 max-h-[70vh] flex items-center justify-center p-2">
                                    <img
                                        src={previewStnkModal.stnk_url}
                                        alt={`STNK ${previewStnkModal.nama_konsumen}`}
                                        className="max-h-[65vh] w-auto rounded object-contain shadow-sm"
                                    />
                                </div>
                            )
                        ) : (
                            <p className="text-sm text-neutral-400 py-8">Berkas STNK tidak ditemukan.</p>
                        )}
                    </div>

                    <DialogFooter className="mt-4 flex sm:justify-between items-center">
                        {previewStnkModal?.stnk_url && (
                            <Button asChild variant="outline" size="sm" className="gap-1.5">
                                <a
                                    href={previewStnkModal.stnk_url}
                                    download
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="size-3.5" />
                                    Unduh File
                                </a>
                            </Button>
                        )}
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" size="sm">
                                Tutup
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Konfirmasi Hapus */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Data Konsumen</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus data konsumen{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedItem?.nama_konsumen}
                            </span>{' '}
                            ({selectedItem?.no_plat})? Berkas STNK yang tersimpan juga akan terhapus dan tindakan ini tidak dapat dibatalkan.
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

MeetAndGreetIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
        {
            title: 'Meet & Greet',
            href: '/meet-and-greet',
        },
    ],
};
