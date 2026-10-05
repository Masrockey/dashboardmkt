import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Tag,
    Trash2,
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
import typesRoute from '@/routes/types';
import type { Category, PaginatedTypes, Segment, TypeItem } from '@/types';

interface TypesIndexProps {
    types: PaginatedTypes;
    segments: Segment[];
    categories: Category[];
    filters: {
        search?: string;
    };
}

export default function TypesIndex({ types, segments, categories, filters }: TypesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<TypeItem | null>(null);

    // Create Form
    const createForm = useForm<{
        nama_type: string;
        category_id: string | number;
        segment_id: string | number;
        nama_pasar: string;
    }>({
        nama_type: '',
        category_id: '',
        segment_id: '',
        nama_pasar: '',
    });

    // Edit Form
    const editForm = useForm<{
        nama_type: string;
        category_id: string | number;
        segment_id: string | number;
        nama_pasar: string;
    }>({
        nama_type: '',
        category_id: '',
        segment_id: '',
        nama_pasar: '',
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            typesRoute.index.url({
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
            typesRoute.index.url(),
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
        createForm.transform((data) => ({
            ...data,
            category_id: data.category_id === '' ? null : Number(data.category_id),
            segment_id: data.segment_id === '' ? null : Number(data.segment_id),
        }));
        createForm.post(typesRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (item: TypeItem) => {
        setSelectedType(item);
        editForm.setData({
            nama_type: item.nama_type,
            category_id: item.category_id ? String(item.category_id) : '',
            segment_id: item.segment_id ? String(item.segment_id) : '',
            nama_pasar: item.nama_pasar || '',
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedType) return;

        editForm.transform((data) => ({
            ...data,
            category_id: data.category_id === '' ? null : Number(data.category_id),
            segment_id: data.segment_id === '' ? null : Number(data.segment_id),
        }));
        editForm.put(typesRoute.update.url(selectedType.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedType(null);
            },
        });
    };

    const handleOpenDelete = (item: TypeItem) => {
        setSelectedType(item);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedType) return;

        deleteForm.delete(typesRoute.destroy.url(selectedType.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedType(null);
            },
        });
    };

    return (
        <>
            <Head title="Master Type" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Tag className="size-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Master Type
                            </h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola data type, kategori, segment, dan nama pasar produk.
                        </p>
                    </div>
                    <Button onClick={handleOpenCreate} className="sm:w-auto">
                        <Plus className="mr-2 size-4" />
                        Tambah Type
                    </Button>
                </div>

                {/* Filters & Actions */}
                <Card className="p-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari type, kategori, segment, atau nama pasar..."
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
                                <TableHead>Type</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Segment</TableHead>
                                <TableHead>Nama Pasar</TableHead>
                                <TableHead>Tanggal Dibuat</TableHead>
                                <TableHead className="w-28 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {types.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                        Data type tidak ditemukan.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                types.data.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-muted-foreground">
                                            {(types.current_page - 1) * types.per_page + index + 1}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                            {item.nama_type}
                                        </TableCell>
                                        <TableCell>
                                            {item.category ? (
                                                <Badge variant="secondary" className="font-medium">
                                                    {item.category.nama_kategori}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    - Tanpa Kategori -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {item.segment ? (
                                                <Badge variant="outline" className="font-medium">
                                                    {item.segment.nama_segment}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    - Tanpa Segment -
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {item.nama_pasar || <span className="text-muted-foreground italic">-</span>}
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
                                                    title="Edit Type"
                                                >
                                                    <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDelete(item)}
                                                    title="Hapus Type"
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
                    {types.total > types.per_page && (
                        <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                            <p className="text-xs text-muted-foreground">
                                Menampilkan {types.from} - {types.to} dari {types.total} data
                            </p>
                            <div className="flex items-center gap-1">
                                {types.prev_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(types.prev_page_url!)}
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

                                {types.next_page_url ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.get(types.next_page_url!)}
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

            {/* Modal Tambah Type */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Type Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan nama type, pilih kategori, pilih segment, dan isi nama pasar.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create_nama_type">Type / Nama Type</Label>
                                <Input
                                    id="create_nama_type"
                                    placeholder="Contoh: BEAT FI, CBR150R, VARIO 160"
                                    value={createForm.data.nama_type}
                                    onChange={(e) => createForm.setData('nama_type', e.target.value)}
                                    disabled={createForm.processing}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.nama_type} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_category_id">Kategori</Label>
                                <Select
                                    value={createForm.data.category_id ? String(createForm.data.category_id) : 'none'}
                                    onValueChange={(val) => createForm.setData('category_id', val === 'none' ? '' : val)}
                                    disabled={createForm.processing}
                                >
                                    <SelectTrigger id="create_category_id" className="w-full">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tanpa Kategori --</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.nama_kategori}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.category_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_segment_id">Segment</Label>
                                <Select
                                    value={createForm.data.segment_id ? String(createForm.data.segment_id) : 'none'}
                                    onValueChange={(val) => createForm.setData('segment_id', val === 'none' ? '' : val)}
                                    disabled={createForm.processing}
                                >
                                    <SelectTrigger id="create_segment_id" className="w-full">
                                        <SelectValue placeholder="Pilih Segment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tanpa Segment --</SelectItem>
                                        {segments.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.nama_segment}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.segment_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_nama_pasar">Nama Pasar</Label>
                                <Input
                                    id="create_nama_pasar"
                                    placeholder="Contoh: BEAT SPORTY CBS ISS"
                                    value={createForm.data.nama_pasar}
                                    onChange={(e) => createForm.setData('nama_pasar', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.nama_pasar} />
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
                                Simpan Type
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Type */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Type</DialogTitle>
                            <DialogDescription>
                                Perbarui nama type, kategori, segment, atau nama pasar.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_nama_type">Type / Nama Type</Label>
                                <Input
                                    id="edit_nama_type"
                                    value={editForm.data.nama_type}
                                    onChange={(e) => editForm.setData('nama_type', e.target.value)}
                                    disabled={editForm.processing}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.nama_type} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_category_id">Kategori</Label>
                                <Select
                                    value={editForm.data.category_id ? String(editForm.data.category_id) : 'none'}
                                    onValueChange={(val) => editForm.setData('category_id', val === 'none' ? '' : val)}
                                    disabled={editForm.processing}
                                >
                                    <SelectTrigger id="edit_category_id" className="w-full">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tanpa Kategori --</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.nama_kategori}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.category_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_segment_id">Segment</Label>
                                <Select
                                    value={editForm.data.segment_id ? String(editForm.data.segment_id) : 'none'}
                                    onValueChange={(val) => editForm.setData('segment_id', val === 'none' ? '' : val)}
                                    disabled={editForm.processing}
                                >
                                    <SelectTrigger id="edit_segment_id" className="w-full">
                                        <SelectValue placeholder="Pilih Segment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tanpa Segment --</SelectItem>
                                        {segments.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.nama_segment}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.segment_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_nama_pasar">Nama Pasar</Label>
                                <Input
                                    id="edit_nama_pasar"
                                    value={editForm.data.nama_pasar}
                                    onChange={(e) => editForm.setData('nama_pasar', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.nama_pasar} />
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
                        <DialogTitle>Hapus Type?</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus type &quot;
                            <span className="font-semibold text-foreground">
                                {selectedType?.nama_type}
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
