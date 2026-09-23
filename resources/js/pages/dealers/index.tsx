import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
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
import dealersRoute from '@/routes/dealers';
import type { Dealer, PaginatedDealers } from '@/types';

interface DealersIndexProps {
    dealers: PaginatedDealers;
    filters: {
        search?: string;
    };
}

export default function DealersIndex({ dealers, filters }: DealersIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);

    // Create Form
    const createForm = useForm({
        kode_dealer: '',
        nama_dealer: '',
    });

    // Edit Form
    const editForm = useForm({
        kode_dealer: '',
        nama_dealer: '',
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            dealersRoute.index.url({
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
            dealersRoute.index.url(),
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
        createForm.post(dealersRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (dealer: Dealer) => {
        setSelectedDealer(dealer);
        editForm.setData({
            kode_dealer: dealer.kode_dealer,
            nama_dealer: dealer.nama_dealer,
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedDealer) {
            return;
        }

        editForm.put(dealersRoute.update.url(selectedDealer.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedDealer(null);
            },
        });
    };

    const handleOpenDelete = (dealer: Dealer) => {
        setSelectedDealer(dealer);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedDealer) {
            return;
        }

        deleteForm.delete(dealersRoute.destroy.url(selectedDealer.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedDealer(null);
            },
        });
    };

    return (
        <>
            <Head title="Dealer" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Menu Dealer
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola data Kode Dealer dan Nama Dealer.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
                        <Plus className="size-4" />
                        Tambah Dealer
                    </Button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Cari Kode atau Nama Dealer..."
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

                {/* Table / Data View */}
                <Card className="overflow-hidden py-0 shadow-xs border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16 text-center">No</TableHead>
                                <TableHead>Kode Dealer</TableHead>
                                <TableHead>Nama Dealer</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dealers.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                                                <Building2 className="size-6 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Belum ada data dealer
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {searchQuery
                                                    ? 'Tidak ditemukan data dengan kata kunci pencarian tersebut.'
                                                    : 'Mulai dengan menambahkan data dealer pertama Anda.'}
                                            </p>
                                            {!searchQuery && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah Dealer
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                dealers.data.map((dealer, index) => {
                                    const rowNumber =
                                        ((dealers.current_page - 1) * dealers.per_page) + index + 1;
                                    return (
                                        <TableRow key={dealer.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>
                                            <TableCell className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {dealer.kode_dealer}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {dealer.nama_dealer}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenEdit(dealer)}
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        title="Edit Dealer"
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(dealer)}
                                                        className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                        title="Hapus Dealer"
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
                    {dealers.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{dealers.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{dealers.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{dealers.total}</span> data
                            </p>

                            <div className="flex items-center gap-1">
                                {dealers.prev_page_url ? (
                                    <Link
                                        href={dealers.prev_page_url}
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

                                {dealers.next_page_url ? (
                                    <Link
                                        href={dealers.next_page_url}
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

            {/* Dialog Tambah Dealer */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Dealer</DialogTitle>
                            <DialogDescription>
                                Masukkan Kode Dealer dan Nama Dealer untuk mendaftarkan dealer baru.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create_kode_dealer">Kode Dealer</Label>
                                <Input
                                    id="create_kode_dealer"
                                    placeholder="Contoh: DLR001"
                                    value={createForm.data.kode_dealer}
                                    onChange={(e) => createForm.setData('kode_dealer', e.target.value)}
                                    disabled={createForm.processing}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.kode_dealer} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_nama_dealer">Nama Dealer</Label>
                                <Input
                                    id="create_nama_dealer"
                                    placeholder="Contoh: Dealer Maju Jaya"
                                    value={createForm.data.nama_dealer}
                                    onChange={(e) => createForm.setData('nama_dealer', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.nama_dealer} />
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
                                Simpan Dealer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Dealer */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Dealer</DialogTitle>
                            <DialogDescription>
                                Perbarui Kode Dealer atau Nama Dealer yang dipilih.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_kode_dealer">Kode Dealer</Label>
                                <Input
                                    id="edit_kode_dealer"
                                    value={editForm.data.kode_dealer}
                                    onChange={(e) => editForm.setData('kode_dealer', e.target.value)}
                                    disabled={editForm.processing}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.kode_dealer} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_nama_dealer">Nama Dealer</Label>
                                <Input
                                    id="edit_nama_dealer"
                                    value={editForm.data.nama_dealer}
                                    onChange={(e) => editForm.setData('nama_dealer', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.nama_dealer} />
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
                        <DialogTitle>Hapus Dealer</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus dealer{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedDealer?.nama_dealer} ({selectedDealer?.kode_dealer})
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

DealersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Pameran',
            href: dashboard(),
        },
        {
            title: 'Dealer',
            href: dealersRoute.index(),
        },
    ],
};

