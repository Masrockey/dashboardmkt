import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCheck,
    Users,
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
import { dashboard } from '@/routes';
import usersRoute from '@/routes/users';
import type { Auth, Dealer, PaginatedUsers, RoleOption, UserItem, UserRole } from '@/types';

interface UsersIndexProps {
    users: PaginatedUsers;
    dealers: Dealer[];
    roles: RoleOption[];
    filters: {
        search?: string;
        role?: string;
    };
}

export default function UsersIndex({ users, dealers, roles, filters }: UsersIndexProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState(filters.role || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

    // Create Form
    const createForm = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'dealer' as UserRole,
        dealer_id: '' as string | number,
    });

    // Edit Form
    const editForm = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'dealer' as UserRole,
        dealer_id: '' as string | number,
    });

    // Delete Form
    const deleteForm = useForm({});

    const applyFilters = (newSearch?: string, newRole?: string) => {
        const search = newSearch !== undefined ? newSearch : searchQuery;
        const role = newRole !== undefined ? newRole : selectedRoleFilter;

        router.get(
            usersRoute.index.url({
                query: {
                    search: search || undefined,
                    role: role || undefined,
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
        applyFilters(searchQuery, selectedRoleFilter);
    };

    const handleRoleFilterChange = (role: string) => {
        setSelectedRoleFilter(role);
        applyFilters(searchQuery, role);
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setSelectedRoleFilter('');
        router.get(
            usersRoute.index.url(),
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
            dealer_id: data.dealer_id === '' ? null : Number(data.dealer_id),
        }));
        createForm.post(usersRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setIsCreateOpen(false);
            },
        });
    };

    const handleOpenEdit = (user: UserItem) => {
        setSelectedUser(user);
        editForm.setData({
            name: user.name,
            username: user.username || '',
            email: user.email,
            password: '',
            role: user.role,
            dealer_id: user.dealer_id ?? '',
        });
        editForm.clearErrors();
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            return;
        }

        editForm.transform((data) => ({
            ...data,
            dealer_id: data.dealer_id === '' ? null : Number(data.dealer_id),
        }));
        editForm.put(usersRoute.update.url(selectedUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const handleOpenDelete = (user: UserItem) => {
        setSelectedUser(user);
        deleteForm.clearErrors();
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedUser) {
            return;
        }

        deleteForm.delete(usersRoute.destroy.url(selectedUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedUser(null);
            },
        });
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'superadmin':
                return (
                    <Badge className="border-purple-200 bg-purple-100 text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                        <Shield className="mr-1 size-3" />
                        Superadmin
                    </Badge>
                );
            case 'spv':
                return (
                    <Badge className="border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        <UserCheck className="mr-1 size-3" />
                        SPV
                    </Badge>
                );
            case 'kabag':
                return (
                    <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Kabag
                    </Badge>
                );
            case 'dealer':
            default:
                return (
                    <Badge className="border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        Dealer
                    </Badge>
                );
        }
    };

    const isFiltered = searchQuery !== '' || selectedRoleFilter !== '';

    return (
        <>
            <Head title="User" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Menu User
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola data akun pengguna, role, dan dealer terkait.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
                        <Plus className="size-4" />
                        Tambah User
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Cari nama, email, atau dealer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    applyFilters('', selectedRoleFilter);
                                }}
                                className="text-muted-foreground hover:text-foreground absolute right-3"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">Role:</span>
                            <Select
                                value={selectedRoleFilter || 'all'}
                                onValueChange={(val) => handleRoleFilterChange(val === 'all' ? '' : val)}
                            >
                                <SelectTrigger className="h-9 w-[150px]">
                                    <SelectValue placeholder="Semua Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    {roles.map((r) => (
                                        <SelectItem key={r.value} value={r.value}>
                                            {r.label}
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
                                <TableHead>Nama & Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Dealer Terkait</TableHead>
                                <TableHead>Tanggal Dibuat</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-neutral-100 p-3 dark:bg-neutral-800">
                                                <Users className="size-6 text-neutral-500 dark:text-neutral-400" />
                                            </div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Belum ada data user
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {isFiltered
                                                    ? 'Tidak ditemukan data dengan filter pencarian tersebut.'
                                                    : 'Mulai dengan menambahkan data user pertama.'}
                                            </p>
                                            {!isFiltered && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah User
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.data.map((user, index) => {
                                    const rowNumber =
                                        ((users.current_page - 1) * users.per_page) + index + 1;
                                    const isCurrentUser = user.id === auth.user.id;

                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {rowNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                            {user.name}
                                                        </span>
                                                        {user.username && (
                                                            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
                                                                @{user.username}
                                                            </span>
                                                        )}
                                                        {isCurrentUser && (
                                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                                Anda
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getRoleBadge(user.role)}
                                            </TableCell>
                                            <TableCell>
                                                {user.dealer ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="size-4 text-neutral-400 shrink-0" />
                                                        <div>
                                                            <span className="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                                [{user.dealer.kode_dealer}]
                                                            </span>{' '}
                                                            <span className="text-neutral-900 dark:text-neutral-100">
                                                                {user.dealer.nama_dealer}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-neutral-400 dark:text-neutral-500">
                                                        Semua Dealer / Pusat
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-neutral-500 dark:text-neutral-400">
                                                {new Date(user.created_at).toLocaleDateString('id-ID', {
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
                                                        onClick={() => handleOpenEdit(user)}
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        title="Edit User"
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDelete(user)}
                                                        disabled={isCurrentUser}
                                                        className="size-8 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-30 dark:hover:bg-red-950/30"
                                                        title={
                                                            isCurrentUser
                                                                ? 'Tidak dapat menghapus akun Anda sendiri'
                                                                : 'Hapus User'
                                                        }
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
                    {users.total > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t px-6 py-4 sm:flex-row">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Menampilkan <span className="font-medium">{users.from ?? 0}</span> sampai{' '}
                                <span className="font-medium">{users.to ?? 0}</span> dari{' '}
                                <span className="font-medium">{users.total}</span> user
                            </p>

                            <div className="flex items-center gap-1">
                                {users.prev_page_url ? (
                                    <Link
                                        href={users.prev_page_url}
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

                                {users.next_page_url ? (
                                    <Link
                                        href={users.next_page_url}
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

            {/* Dialog Tambah User */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah User</DialogTitle>
                            <DialogDescription>
                                Masukkan informasi pengguna baru, tentukan role, dan pilih dealer terkait.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="create_name">Nama Lengkap</Label>
                                <Input
                                    id="create_name"
                                    placeholder="Contoh: Budi Santoso"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    disabled={createForm.processing}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_username">
                                    Username <span className="text-xs font-normal text-muted-foreground">(opsional untuk login)</span>
                                </Label>
                                <Input
                                    id="create_username"
                                    placeholder="Contoh: budi_santoso"
                                    value={createForm.data.username}
                                    onChange={(e) => createForm.setData('username', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.username} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_email">Alamat Email</Label>
                                <Input
                                    id="create_email"
                                    type="email"
                                    placeholder="Contoh: budi@dealermotor.com"
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create_password">Password</Label>
                                <Input
                                    id="create_password"
                                    type="password"
                                    placeholder="Minimal 8 karakter"
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    disabled={createForm.processing}
                                />
                                <InputError message={createForm.errors.password} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_role">Role</Label>
                                    <Select
                                        value={createForm.data.role}
                                        onValueChange={(val) => createForm.setData('role', val as UserRole)}
                                        disabled={createForm.processing}
                                    >
                                        <SelectTrigger id="create_role" className="w-full">
                                            <SelectValue placeholder="Pilih Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((r) => (
                                                <SelectItem key={r.value} value={r.value}>
                                                    {r.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={createForm.errors.role} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_dealer_id">Dealer Terkait</Label>
                                    <Select
                                        value={createForm.data.dealer_id ? String(createForm.data.dealer_id) : 'none'}
                                        onValueChange={(val) => createForm.setData('dealer_id', val === 'none' ? '' : val)}
                                        disabled={createForm.processing}
                                    >
                                        <SelectTrigger id="create_dealer_id" className="w-full">
                                            <SelectValue placeholder="Pilih Dealer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Tanpa Dealer (Pusat) --</SelectItem>
                                            {dealers.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    [{d.kode_dealer}] {d.nama_dealer}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={createForm.errors.dealer_id} />
                                </div>
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
                                Simpan User
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit User */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                            <DialogDescription>
                                Perbarui data pengguna, ubah role, atau ganti password jika diperlukan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_name">Nama Lengkap</Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    disabled={editForm.processing}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_username">
                                    Username <span className="text-xs font-normal text-muted-foreground">(opsional untuk login)</span>
                                </Label>
                                <Input
                                    id="edit_username"
                                    placeholder="Contoh: budi_santoso"
                                    value={editForm.data.username}
                                    onChange={(e) => editForm.setData('username', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.username} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_email">Alamat Email</Label>
                                <Input
                                    id="edit_email"
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="edit_password">
                                    Password Baru <span className="text-xs font-normal text-muted-foreground">(kosongkan jika tidak ingin diubah)</span>
                                </Label>
                                <Input
                                    id="edit_password"
                                    type="password"
                                    placeholder="Biarkan kosong jika tidak ganti"
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    disabled={editForm.processing}
                                />
                                <InputError message={editForm.errors.password} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                 <div className="space-y-1.5">
                                     <Label htmlFor="edit_role">Role</Label>
                                     <Select
                                         value={editForm.data.role}
                                         onValueChange={(val) => editForm.setData('role', val as UserRole)}
                                         disabled={editForm.processing}
                                     >
                                         <SelectTrigger id="edit_role" className="w-full">
                                             <SelectValue placeholder="Pilih Role" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             {roles.map((r) => (
                                                 <SelectItem key={r.value} value={r.value}>
                                                     {r.label}
                                                 </SelectItem>
                                             ))}
                                         </SelectContent>
                                     </Select>
                                     <InputError message={editForm.errors.role} />
                                 </div>

                                 <div className="space-y-1.5">
                                     <Label htmlFor="edit_dealer_id">Dealer Terkait</Label>
                                     <Select
                                         value={editForm.data.dealer_id ? String(editForm.data.dealer_id) : 'none'}
                                         onValueChange={(val) => editForm.setData('dealer_id', val === 'none' ? '' : val)}
                                         disabled={editForm.processing}
                                     >
                                         <SelectTrigger id="edit_dealer_id" className="w-full">
                                             <SelectValue placeholder="Pilih Dealer" />
                                         </SelectTrigger>
                                         <SelectContent>
                                             <SelectItem value="none">-- Tanpa Dealer (Pusat) --</SelectItem>
                                             {dealers.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>
                                                    [{d.kode_dealer}] {d.nama_dealer}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={editForm.errors.dealer_id} />
                                </div>
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
                        <DialogTitle>Hapus User</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus pengguna{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedUser?.name} ({selectedUser?.email})
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

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
        {
            title: 'User',
            href: usersRoute.index(),
        },
    ],
};

