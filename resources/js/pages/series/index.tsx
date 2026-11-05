import { Head, router, useForm } from '@inertiajs/react';
import {
    Boxes,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import InputError from '@/components/input-error';
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
import { Textarea } from '@/components/ui/textarea';
import seriesRoute from '@/routes/series';
import type { PaginatedSeries, Series } from '@/types';

interface SeriesIndexProps {
    series: PaginatedSeries;
    filters: {
        search?: string;
    };
}

export default function SeriesIndex({ series, filters }: SeriesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

    // Create Form
    const createForm = useForm<{
        nama: string;
        deskripsi: string;
    }>({
        nama: '',
        deskripsi: '',
    });

    // Edit Form
    const editForm = useForm<{
        nama: string;
        deskripsi: string;
    }>({
        nama: '',
        deskripsi: '',
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            seriesRoute.index.url({
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
            seriesRoute.index.url(),
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
        createForm.post(seriesRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (item: Series) => {
        setSelectedSeries(item);
        editForm.setData({
            nama: item.nama,
            deskripsi: item.deskripsi || '',
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedSeries) return;

        editForm.put(seriesRoute.update.url(selectedSeries.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedSeries(null);
            },
        });
    };

    const handleOpenDelete = (item: Series) => {
        setSelectedSeries(item);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedSeries) return;

        deleteForm.delete(seriesRoute.destroy.url(selectedSeries.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedSeries(null);
            },
        });
    };

    return (
        <>
            <Head title="Master Series" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Boxes className="size-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Master Series
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola data master series kendaraan (nama dan deskripsi).
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="sm:w-auto">
                        <Plus className="mr-2 size-4" />
                        Tambah Series
                    </Button>
                </div>

                {/* Filters & Actions */}
                <Card className="p-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau deskripsi series..."
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
                        <div className="flex items-center gap-2">
                            <Button type="submit" variant="secondary">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button type="button" variant="outline" onClick={handleResetSearch}>
                                    Reset
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Table Data */}
                <Card className="overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">#</TableHead>
                                <TableHead className="w-64">Nama Series</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead className="w-48">Tanggal Dibuat</TableHead>
                                <TableHead className="w-28 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {series.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        Data series tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                series.data.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(series.current_page - 1) * series.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                            {item.nama}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm max-w-md truncate">
                                            {item.deskripsi || <span className="text-neutral-400 italic">-</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenEdit(item)}
                                                    title="Edit Series"
                                                >
                                                    <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDelete(item)}
                                                    title="Hapus Series"
                                                >
                                                    <Trash2 className="size-4 text-destructive hover:text-destructive/80" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {series.total > series.per_page && (
                        <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {series.from} - {series.to} dari {series.total} data
                            </p>
                            <div className="flex items-center gap-1">
                                {series.prev_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(series.prev_page_url!)}
                                    >
                                        <ChevronLeft className="mr-1 size-4" />
                                        Prev
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>
                                        <ChevronLeft className="mr-1 size-4" />
                                        Prev
                                    </Button>
                                )}

                                {series.next_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(series.next_page_url!)}
                                    >
                                        Next
                                        <ChevronRight className="ml-1 size-4" />
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" disabled>
                                        Next
                                        <ChevronRight className="ml-1 size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modal Tambah Series */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Series Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan nama dan deskripsi series kendaraan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create_nama">Nama Series</Label>
                                <Input
                                    id="create_nama"
                                    placeholder="Contoh: BeAT, Vario, Scoopy, PCX"
                                    value={createForm.data.nama}
                                    onChange={(e) => createForm.setData('nama', e.target.value)}
                                    disabled={createForm.processing}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.nama} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_deskripsi">Deskripsi</Label>
                                <Textarea
                                    id="create_deskripsi"
                                    placeholder="Deskripsi atau keterangan series (opsional)..."
                                    rows={3}
                                    value={createForm.data.deskripsi}
                                    onChange={(e) => createForm.setData('deskripsi', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.deskripsi} />
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
                                Simpan Series
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Series */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Series</DialogTitle>
                            <DialogDescription>
                                Perbarui nama dan deskripsi series kendaraan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_nama">Nama Series</Label>
                                <Input
                                    id="edit_nama"
                                    value={editForm.data.nama}
                                    onChange={(e) => editForm.setData('nama', e.target.value)}
                                    disabled={editForm.processing}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.nama} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_deskripsi">Deskripsi</Label>
                                <Textarea
                                    id="edit_deskripsi"
                                    placeholder="Deskripsi atau keterangan series (opsional)..."
                                    rows={3}
                                    value={editForm.data.deskripsi}
                                    onChange={(e) => editForm.setData('deskripsi', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.deskripsi} />
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

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Hapus Series</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus series{' '}
                            <span className="font-semibold text-foreground">
                                {selectedSeries?.nama}
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
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

