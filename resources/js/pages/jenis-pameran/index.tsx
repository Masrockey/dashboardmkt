import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    MapPin,
    Pencil,
    Plus,
    Search,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
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
import { dashboard } from '@/routes';
import jenisPameranRoute from '@/routes/jenis-pameran';
import type { JenisPameran, PaginatedJenisPameran } from '@/types';

interface JenisPameranIndexProps {
    jenisPameran: PaginatedJenisPameran;
    filters: {
        search?: string;
    };
}

export default function JenisPameranIndex({
    jenisPameran,
    filters,
}: JenisPameranIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedPameran, setSelectedPameran] = useState<JenisPameran | null>(null);

    // File input refs for clearing
    const createFileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    // Previews for uploaded file
    const [createPreview, setCreatePreview] = useState<string | null>(null);
    const [editPreview, setEditPreview] = useState<string | null>(null);
    const [removeExistingIcon, setRemoveExistingIcon] = useState(false);

    // Create Form
    const createForm = useForm<{
        kode_pameran: string;
        jenis_pameran: string;
        icon_map: File | null;
    }>({
        kode_pameran: '',
        jenis_pameran: '',
        icon_map: null,
    });

    // Edit Form
    const editForm = useForm<{
        kode_pameran: string;
        jenis_pameran: string;
        icon_map: File | null;
        remove_icon_map: boolean;
    }>({
        kode_pameran: '',
        jenis_pameran: '',
        icon_map: null,
        remove_icon_map: false,
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            jenisPameranRoute.index.url({
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
            jenisPameranRoute.index.url(),
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
        setCreatePreview(null);
        if (createFileInputRef.current) {
            createFileInputRef.current.value = '';
        }
        setIsCreateOpen(true);
    };

    const handleCreateFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        createForm.setData('icon_map', file);
        if (file) {
            setCreatePreview(URL.createObjectURL(file));
        } else {
            setCreatePreview(null);
        }
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(jenisPameranRoute.store.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setCreatePreview(null);
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (pameran: JenisPameran) => {
        setSelectedPameran(pameran);
        editForm.setData({
            kode_pameran: pameran.kode_pameran,
            jenis_pameran: pameran.jenis_pameran,
            icon_map: null,
            remove_icon_map: false,
        });
        editForm.clearErrors();
        setEditPreview(null);
        setRemoveExistingIcon(false);
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
        setIsEditOpen(true);
    };

    const handleEditFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        editForm.setData('icon_map', file);
        setRemoveExistingIcon(false);
        editForm.setData('remove_icon_map', false);

        if (file) {
            setEditPreview(URL.createObjectURL(file));
        } else {
            setEditPreview(null);
        }
    };

    const handleRemoveEditIcon = () => {
        setRemoveExistingIcon(true);
        setEditPreview(null);
        editForm.setData({
            ...editForm.data,
            icon_map: null,
            remove_icon_map: true,
        });
        if (editFileInputRef.current) {
            editFileInputRef.current.value = '';
        }
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedPameran) {
            return;
        }

        // Use router.post with _method: 'PUT' for multipart/form-data in Laravel
        router.post(
            jenisPameranRoute.update.url(selectedPameran.id),
            {
                _method: 'PUT',
                kode_pameran: editForm.data.kode_pameran,
                jenis_pameran: editForm.data.jenis_pameran,
                icon_map: editForm.data.icon_map,
                remove_icon_map: editForm.data.remove_icon_map ? 1 : 0,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedPameran(null);
                    setEditPreview(null);
                },
                onError: (errors) => {
                    editForm.setError(errors as Record<string, string>);
                },
            },
        );
    };

    const handleOpenDelete = (pameran: JenisPameran) => {
        setSelectedPameran(pameran);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPameran) {
            return;
        }

        deleteForm.delete(jenisPameranRoute.destroy.url(selectedPameran.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedPameran(null);
            },
        });
    };

    return (
        <>
            <Head title="Jenis Channel" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Menu Jenis Channel
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola data Kode Channel, Nama Jenis Channel, dan Icon Map.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
                        <Plus className="size-4" />
                        Tambah Jenis Channel
                    </Button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Cari Kode atau Nama Jenis Channel..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleResetSearch}
                                className="text-muted-foreground hover:text-foreground absolute right-3"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Table Data View */}
                <Card className="overflow-hidden py-0 shadow-xs border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">No</TableHead>
                                <TableHead>Kode Channel</TableHead>
                                <TableHead>Nama Jenis Channel</TableHead>
                                <TableHead>Icon Map</TableHead>
                                <TableHead>Tanggal Dibuat</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jenisPameran.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                                                <MapPin className="size-6 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Belum ada data jenis channel
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {searchQuery
                                                    ? 'Tidak ditemukan data dengan kata kunci pencarian tersebut.'
                                                    : 'Mulai dengan menambahkan data jenis channel pertama.'}
                                            </p>
                                            {!searchQuery && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah Jenis Channel
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                jenisPameran.data.map((item, index) => {
                                    const rowNumber =
                                        ((jenisPameran.current_page - 1) * jenisPameran.per_page) +
                                        index +
                                        1;
                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>
                                            <TableCell className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {item.kode_pameran}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {item.jenis_pameran}
                                            </TableCell>
                                            <TableCell>
                                                {item.icon_map_url ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-9 items-center justify-center rounded-md border bg-neutral-50 p-1 dark:bg-neutral-900">
                                                            <img
                                                                src={item.icon_map_url}
                                                                alt={item.jenis_pameran}
                                                                className="size-7 object-contain"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            Tersedia
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500">
                                                        <MapPin className="size-4 opacity-50" />
                                                        <span className="text-xs italic">Tanpa Icon</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-neutral-500 dark:text-neutral-400">
                                                {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        title="Edit Jenis Channel"
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(item)}
                                                        className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                        title="Hapus Jenis Channel"
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
                    {jenisPameran.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{jenisPameran.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{jenisPameran.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{jenisPameran.total}</span> jenis channel
                            </p>

                            <div className="flex items-center gap-1">
                                {jenisPameran.prev_page_url ? (
                                    <Link
                                        href={jenisPameran.prev_page_url}
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

                                {jenisPameran.next_page_url ? (
                                    <Link
                                        href={jenisPameran.next_page_url}
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

            {/* Dialog Tambah Jenis Channel */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Jenis Channel</DialogTitle>
                            <DialogDescription>
                                Masukkan Kode Channel, Nama Jenis Channel, dan opsional Icon Map untuk marker peta.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create_kode_pameran">Kode Channel</Label>
                                <Input
                                    id="create_kode_pameran"
                                    placeholder="Contoh: CH01"
                                    value={createForm.data.kode_pameran}
                                    onChange={(e) => createForm.setData('kode_pameran', e.target.value)}
                                    disabled={createForm.processing}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.kode_pameran} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_jenis_pameran">Nama Jenis Channel</Label>
                                <Input
                                    id="create_jenis_pameran"
                                    placeholder="Contoh: POS / Reguler / Booth"
                                    value={createForm.data.jenis_pameran}
                                    onChange={(e) => createForm.setData('jenis_pameran', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.jenis_pameran} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="create_icon_map">Icon Map</Label>
                                    <span className="text-xs text-neutral-400">Opsional (Bisa Kosong)</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {createPreview ? (
                                        <div className="relative size-14 shrink-0 rounded-lg border bg-neutral-50 p-1.5 dark:bg-neutral-900">
                                            <img
                                                src={createPreview}
                                                alt="Preview"
                                                className="size-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCreatePreview(null);
                                                    createForm.setData('icon_map', null);
                                                    if (createFileInputRef.current) {
                                                        createFileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed bg-neutral-50/50 text-neutral-400 dark:bg-neutral-900/50">
                                            <ImageIcon className="size-6 opacity-40" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            ref={createFileInputRef}
                                            id="create_icon_map"
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            onChange={handleCreateFileChange}
                                            disabled={createForm.processing}
                                            className="text-muted-foreground file:border-input file:text-foreground file:hover:bg-accent block w-full text-xs file:mr-2 file:rounded-md file:border file:bg-transparent file:px-2.5 file:py-1 file:text-xs file:font-medium"
                                        />
                                        <p className="mt-1 text-[11px] text-neutral-500">
                                            Format: PNG, SVG, JPG, WebP (maks. 2MB)
                                        </p>
                                    </div>
                                </div>
                                <InputError message={createForm.errors.icon_map} />
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
                                Simpan Jenis Channel
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Jenis Channel */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Jenis Channel</DialogTitle>
                            <DialogDescription>
                                Perbarui Kode Channel, Nama Jenis Channel, atau ganti/hapus Icon Map.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kode_pameran">Kode Channel</Label>
                                <Input
                                    id="edit_kode_pameran"
                                    value={editForm.data.kode_pameran}
                                    onChange={(e) => editForm.setData('kode_pameran', e.target.value)}
                                    disabled={editForm.processing}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.kode_pameran} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_jenis_pameran">Nama Jenis Channel</Label>
                                <Input
                                    id="edit_jenis_pameran"
                                    value={editForm.data.jenis_pameran}
                                    onChange={(e) => editForm.setData('jenis_pameran', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.jenis_pameran} />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit_icon_map">Icon Map</Label>
                                    <span className="text-xs text-neutral-400">Opsional (Bisa Kosong)</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Preview: New file preview OR existing icon if not removed */}
                                    {editPreview ? (
                                        <div className="relative size-14 shrink-0 rounded-lg border bg-neutral-50 p-1.5 dark:bg-neutral-900">
                                            <img
                                                src={editPreview}
                                                alt="Preview Baru"
                                                className="size-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditPreview(null);
                                                    editForm.setData('icon_map', null);
                                                    if (editFileInputRef.current) {
                                                        editFileInputRef.current.value = '';
                                                    }
                                                }}
                                                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ) : selectedPameran?.icon_map_url && !removeExistingIcon ? (
                                        <div className="relative size-14 shrink-0 rounded-lg border bg-neutral-50 p-1.5 dark:bg-neutral-900">
                                            <img
                                                src={selectedPameran.icon_map_url}
                                                alt={selectedPameran.jenis_pameran}
                                                className="size-full object-contain"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveEditIcon}
                                                title="Hapus icon saat ini"
                                                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow-xs hover:bg-red-600"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed bg-neutral-50/50 text-neutral-400 dark:bg-neutral-900/50">
                                            <ImageIcon className="size-6 opacity-40" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            ref={editFileInputRef}
                                            id="edit_icon_map"
                                            type="file"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            onChange={handleEditFileChange}
                                            disabled={editForm.processing}
                                            className="text-muted-foreground file:border-input file:text-foreground file:hover:bg-accent block w-full text-xs file:mr-2 file:rounded-md file:border file:bg-transparent file:px-2.5 file:py-1 file:text-xs file:font-medium"
                                        />
                                        <div className="mt-1 flex items-center justify-between">
                                            <p className="text-[11px] text-neutral-500">
                                                Unggah file untuk mengganti icon
                                            </p>
                                            {selectedPameran?.icon_map_url && !removeExistingIcon && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveEditIcon}
                                                    className="text-[11px] text-red-500 hover:underline"
                                                >
                                                    Hapus Icon
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <InputError message={editForm.errors.icon_map} />
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
                        <DialogTitle>Hapus Jenis Channel</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus jenis channel{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedPameran?.jenis_pameran} ({selectedPameran?.kode_pameran})
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

JenisPameranIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
        {
            title: 'Jenis Channel',
            href: jenisPameranRoute.index(),
        },
    ],
};

