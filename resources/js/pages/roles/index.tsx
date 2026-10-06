import { Head, router, useForm } from '@inertiajs/react';
import {
    Check,
    CheckSquare,
    Eye,
    Key,
    Pencil,
    Plus,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Square,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import rolesRoute from '@/routes/roles';
import type { GroupedPermissions, PermissionGroup, RoleItem } from '@/types';

interface RolesIndexProps {
    roles: RoleItem[];
    groupedPermissions: GroupedPermissions;
    filters: {
        search?: string;
    };
}

function getActionMeta(actionType: string) {
    switch (actionType) {
        case 'read':
            return {
                label: 'Read',
                badgeBg:
                    'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
                activeCard:
                    'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800/80 dark:bg-emerald-950/30',
                icon: Eye,
            };
        case 'write':
            return {
                label: 'Write',
                badgeBg:
                    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
                activeCard:
                    'border-blue-300 bg-blue-50/70 dark:border-blue-800/80 dark:bg-blue-950/30',
                icon: Pencil,
            };
        case 'delete':
            return {
                label: 'Delete',
                badgeBg:
                    'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
                activeCard:
                    'border-rose-300 bg-rose-50/70 dark:border-rose-800/80 dark:bg-rose-950/30',
                icon: Trash2,
            };
        case 'approval':
            return {
                label: 'Approval',
                badgeBg:
                    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
                activeCard:
                    'border-purple-300 bg-purple-50/70 dark:border-purple-800/80 dark:bg-purple-950/30',
                icon: ShieldCheck,
            };
        default:
            return {
                label: actionType.toUpperCase(),
                badgeBg:
                    'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
                activeCard:
                    'border-neutral-300 bg-neutral-100/70 dark:border-neutral-700 dark:bg-neutral-800/40',
                icon: Check,
            };
    }
}

interface PermissionControlMatrixProps {
    groupedPermissions: GroupedPermissions;
    selectedPermissions: string[];
    allPermissionKeys: string[];
    onChange: (permissions: string[]) => void;
    error?: string;
}

function PermissionControlMatrix({
    groupedPermissions,
    selectedPermissions,
    allPermissionKeys,
    onChange,
    error,
}: PermissionControlMatrixProps) {
    const [filterQuery, setFilterQuery] = useState('');

    // Precompute action types across all groups
    const { allReadKeys, allWriteKeys, allDeleteKeys } = useMemo(() => {
        const reads: string[] = [];
        const writes: string[] = [];
        const deletes: string[] = [];

        Object.values(groupedPermissions).forEach((grp) => {
            grp.features.forEach((feat) => {
                feat.actions.forEach((act) => {
                    if (act.action === 'read') reads.push(act.key);
                    if (act.action === 'write') writes.push(act.key);
                    if (act.action === 'delete') deletes.push(act.key);
                });
            });
        });

        return { allReadKeys: reads, allWriteKeys: writes, allDeleteKeys: deletes };
    }, [groupedPermissions]);

    const toggleAction = (key: string) => {
        if (selectedPermissions.includes(key)) {
            onChange(selectedPermissions.filter((k) => k !== key));
        } else {
            onChange([...selectedPermissions, key]);
        }
    };

    const toggleFeature = (actions: { key: string }[]) => {
        const keys = actions.map((a) => a.key);
        const allSelected = keys.every((k) => selectedPermissions.includes(k));
        if (allSelected) {
            onChange(selectedPermissions.filter((k) => !keys.includes(k)));
        } else {
            onChange(Array.from(new Set([...selectedPermissions, ...keys])));
        }
    };

    const toggleGroupActionType = (group: PermissionGroup, actionType: string) => {
        const keys: string[] = [];
        group.features.forEach((feat) => {
            feat.actions
                .filter((a) => a.action === actionType)
                .forEach((a) => keys.push(a.key));
        });
        if (keys.length === 0) return;

        const allSelected = keys.every((k) => selectedPermissions.includes(k));
        if (allSelected) {
            onChange(selectedPermissions.filter((k) => !keys.includes(k)));
        } else {
            onChange(Array.from(new Set([...selectedPermissions, ...keys])));
        }
    };

    const toggleEntireGroup = (group: PermissionGroup) => {
        const keys: string[] = [];
        group.features.forEach((feat) => {
            feat.actions.forEach((a) => keys.push(a.key));
        });

        const allSelected = keys.every((k) => selectedPermissions.includes(k));
        if (allSelected) {
            onChange(selectedPermissions.filter((k) => !keys.includes(k)));
        } else {
            onChange(Array.from(new Set([...selectedPermissions, ...keys])));
        }
    };

    const handleSelectAll = () => {
        onChange([...allPermissionKeys]);
    };

    const handleSelectOnlyRead = () => {
        onChange([...allReadKeys]);
    };

    const handleSelectReadWrite = () => {
        onChange(Array.from(new Set([...allReadKeys, ...allWriteKeys])));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    // Filter features according to search query
    const filteredGroups = useMemo(() => {
        if (!filterQuery.trim()) {
            return Object.entries(groupedPermissions);
        }

        const query = filterQuery.toLowerCase().trim();
        const result: [string, PermissionGroup][] = [];

        Object.entries(groupedPermissions).forEach(([groupName, groupData]) => {
            const matchesGroup = groupName.toLowerCase().includes(query);
            const matchedFeatures = groupData.features.filter((feat) => {
                return (
                    matchesGroup ||
                    feat.feature.toLowerCase().includes(query) ||
                    feat.actions.some(
                        (a) =>
                            a.label.toLowerCase().includes(query) ||
                            a.description.toLowerCase().includes(query) ||
                            a.action.toLowerCase().includes(query),
                    )
                );
            });

            if (matchedFeatures.length > 0) {
                result.push([
                    groupName,
                    {
                        ...groupData,
                        features: matchedFeatures,
                    },
                ]);
            }
        });

        return result;
    }, [groupedPermissions, filterQuery]);

    return (
        <div className="space-y-4 pt-2">
            {/* Header & Quick Action Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            Kontrol Hak Akses Menu & Modul
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Atur izin granular (Read, Write, Delete) untuk setiap modul dan fitur sistem.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs bg-white dark:bg-neutral-900"
                            onClick={handleSelectAll}
                        >
                            <CheckSquare className="mr-1 size-3.5" />
                            Pilih Semua
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
                            onClick={handleSelectOnlyRead}
                        >
                            <Eye className="mr-1 size-3.5" />
                            Hanya Read
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50"
                            onClick={handleSelectReadWrite}
                        >
                            <Pencil className="mr-1 size-3.5" />
                            Read + Write
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-neutral-600 dark:text-neutral-400"
                            onClick={handleClearAll}
                        >
                            <Square className="mr-1 size-3.5" />
                            Batal Semua
                        </Button>
                    </div>
                </div>

                {/* Fast filter */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute left-3 top-2.5 size-3.5 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Filter modul, nama menu, atau aksi (cth: channel, pameran, read)..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="h-8 pl-8 pr-8 text-xs bg-white dark:bg-neutral-900"
                    />
                    {filterQuery && (
                        <button
                            type="button"
                            onClick={() => setFilterQuery('')}
                            className="text-muted-foreground hover:text-foreground absolute right-2.5 top-2.5 size-3.5"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <InputError message={error} />

            {/* Groups list */}
            <div className="space-y-4">
                {filteredGroups.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-800">
                        <p className="text-sm font-medium text-neutral-500">
                            Tidak ada hak akses yang cocok dengan filter &quot;{filterQuery}&quot;.
                        </p>
                    </div>
                ) : (
                    filteredGroups.map(([groupName, groupData]) => {
                        const groupActions = groupData.features.flatMap((f) => f.actions);
                        const groupActionKeys = groupActions.map((a) => a.key);
                        const selectedInGroup = groupActionKeys.filter((k) =>
                            selectedPermissions.includes(k),
                        ).length;
                        const isAllGroupSelected =
                            groupActionKeys.length > 0 &&
                            selectedInGroup === groupActionKeys.length;

                        // Check action types availability in this group
                        const readInGroup = groupActions.filter((a) => a.action === 'read');
                        const writeInGroup = groupActions.filter((a) => a.action === 'write');
                        const deleteInGroup = groupActions.filter((a) => a.action === 'delete');

                        const isAllReadInGroup =
                            readInGroup.length > 0 &&
                            readInGroup.every((a) => selectedPermissions.includes(a.key));
                        const isAllWriteInGroup =
                            writeInGroup.length > 0 &&
                            writeInGroup.every((a) => selectedPermissions.includes(a.key));
                        const isAllDeleteInGroup =
                            deleteInGroup.length > 0 &&
                            deleteInGroup.every((a) => selectedPermissions.includes(a.key));

                        return (
                            <div
                                key={groupName}
                                className="rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
                            >
                                {/* Group Header */}
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-2.5 mb-3 dark:border-neutral-800">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                            Modul {groupName}
                                        </span>
                                        <Badge
                                            variant={selectedInGroup > 0 ? 'default' : 'outline'}
                                            className="text-[10px]"
                                        >
                                            {selectedInGroup} / {groupActionKeys.length} dipilih
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1">
                                        {readInGroup.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 px-2 text-[11px] ${
                                                    isAllReadInGroup
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                                }`}
                                                onClick={() => toggleGroupActionType(groupData, 'read')}
                                            >
                                                <Eye className="mr-1 size-3" />
                                                {isAllReadInGroup ? 'Batal Read' : '+ Read'}
                                            </Button>
                                        )}
                                        {writeInGroup.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 px-2 text-[11px] ${
                                                    isAllWriteInGroup
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                        : 'text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40'
                                                }`}
                                                onClick={() => toggleGroupActionType(groupData, 'write')}
                                            >
                                                <Pencil className="mr-1 size-3" />
                                                {isAllWriteInGroup ? 'Batal Write' : '+ Write'}
                                            </Button>
                                        )}
                                        {deleteInGroup.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className={`h-6 px-2 text-[11px] ${
                                                    isAllDeleteInGroup
                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                        : 'text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
                                                }`}
                                                onClick={() => toggleGroupActionType(groupData, 'delete')}
                                            >
                                                <Trash2 className="mr-1 size-3" />
                                                {isAllDeleteInGroup ? 'Batal Delete' : '+ Delete'}
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400"
                                            onClick={() => toggleEntireGroup(groupData)}
                                        >
                                            {isAllGroupSelected ? 'Batalkan Grup' : 'Pilih Semua Grup'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-3">
                                    {groupData.features.map((feat) => {
                                        const featKeys = feat.actions.map((a) => a.key);
                                        const selectedInFeat = featKeys.filter((k) =>
                                            selectedPermissions.includes(k),
                                        ).length;
                                        const isAllFeatSelected =
                                            featKeys.length > 0 && selectedInFeat === featKeys.length;

                                        return (
                                            <div
                                                key={feat.feature}
                                                className="rounded-xl border border-neutral-200/90 bg-white p-3 shadow-xs dark:border-neutral-800 dark:bg-neutral-950"
                                            >
                                                {/* Feature Header */}
                                                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2.5 dark:border-neutral-800/80">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                                                            {feat.feature}
                                                        </span>
                                                        <Badge
                                                            variant={selectedInFeat > 0 ? 'secondary' : 'outline'}
                                                            className="text-[10px] px-1.5 py-0"
                                                        >
                                                            {selectedInFeat} / {feat.actions.length} aksi
                                                        </Badge>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFeature(feat.actions)}
                                                        className="rounded px-1.5 py-0.5 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                                                    >
                                                        {isAllFeatSelected ? 'Batalkan Fitur' : 'Pilih Semua'}
                                                    </button>
                                                </div>

                                                {/* Action Checkboxes Grid */}
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {feat.actions.map((act) => {
                                                        const checked = selectedPermissions.includes(act.key);
                                                        const meta = getActionMeta(act.action);
                                                        const IconComponent = meta.icon;

                                                        return (
                                                            <label
                                                                key={act.key}
                                                                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors select-none ${
                                                                    checked
                                                                        ? meta.activeCard
                                                                        : 'border-neutral-200/70 bg-neutral-50/40 hover:bg-neutral-100/60 dark:border-neutral-800 dark:bg-neutral-900/40 dark:hover:bg-neutral-900'
                                                                }`}
                                                            >
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={() => toggleAction(act.key)}
                                                                    className="mt-0.5"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${meta.badgeBg}`}
                                                                        >
                                                                            <IconComponent className="size-2.5" />
                                                                            {meta.label}
                                                                        </span>
                                                                        <span className="truncate text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                                                                            {act.label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                                        {act.description}
                                                                    </p>
                                                                </div>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default function RolesIndex({
    roles,
    groupedPermissions,
    filters,
}: RolesIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
    const [activePermissionPreview, setActivePermissionPreview] = useState<RoleItem | null>(null);

    // List of all valid permission keys across all groups
    const allPermissionKeys = useMemo(() => {
        const keys: string[] = [];
        Object.values(groupedPermissions).forEach((group) => {
            group.features.forEach((feat) => {
                feat.actions.forEach((act) => keys.push(act.key));
            });
        });
        return keys;
    }, [groupedPermissions]);

    // Create Form
    const createForm = useForm({
        name: '',
        label: '',
        description: '',
        permissions: [] as string[],
    });

    // Edit Form
    const editForm = useForm({
        label: '',
        description: '',
        permissions: [] as string[],
    });

    // Delete Form
    const deleteForm = useForm({});

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            rolesRoute.index.url({
                query: {
                    search: searchQuery || undefined,
                },
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        router.get(
            rolesRoute.index.url(),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Auto-generate slug/name from label when typing in create form
    const handleLabelChangeCreate = (label: string) => {
        createForm.setData((prev) => {
            const formattedSlug = label
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');

            const prevSlug = prev.label
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');

            const shouldUpdateSlug = prev.name === '' || prev.name === prevSlug;

            return {
                ...prev,
                label,
                name: shouldUpdateSlug ? formattedSlug : prev.name,
            };
        });
    };

    const handleOpenCreate = () => {
        createForm.reset();
        createForm.clearErrors();
        setIsCreateOpen(true);
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post(rolesRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleOpenEdit = (role: RoleItem) => {
        setSelectedRole(role);
        editForm.clearErrors();

        // Expand any legacy broad permissions (e.g. 'pcd.channel' -> 'pcd.channel.read', 'pcd.channel.write', etc.)
        const expandedPermissions = new Set<string>();
        (role.permissions || []).forEach((p) => {
            if (p === '*') {
                expandedPermissions.add('*');
                return;
            }
            if (p === 'master_data.access') {
                allPermissionKeys
                    .filter((k) => k.startsWith('master_data.'))
                    .forEach((k) => expandedPermissions.add(k));
                return;
            }
            let matchedChild = false;
            allPermissionKeys.forEach((k) => {
                if (k === p || k.startsWith(p + '.')) {
                    expandedPermissions.add(k);
                    matchedChild = true;
                }
            });
            if (!matchedChild) {
                expandedPermissions.add(p);
            }
        });

        editForm.setData({
            label: role.label,
            description: role.description || '',
            permissions: Array.from(expandedPermissions),
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;

        editForm.put(rolesRoute.update.url(selectedRole.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedRole(null);
            },
        });
    };

    const handleOpenDelete = (role: RoleItem) => {
        setSelectedRole(role);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRole) return;

        deleteForm.delete(rolesRoute.destroy.url(selectedRole.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedRole(null);
            },
        });
    };

    // Summary statistics
    const stats = useMemo(() => {
        const total = roles.length;
        const system = roles.filter((r) => r.is_system).length;
        const custom = total - system;
        const totalUsers = roles.reduce((acc, r) => acc + (r.users_count || 0), 0);
        return { total, system, custom, totalUsers };
    }, [roles]);

    const isFiltered = searchQuery !== '';

    return (
        <>
            <Head title="Role & Hak Akses" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Menu Role & Hak Akses
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola role pengguna dan kontrol hak akses menu (Read, Write, Delete) dalam sistem dashboard.
                        </p>
                    </div>

                    <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
                        <Plus className="size-4" />
                        Tambah Role
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    <Shield className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Total Role
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
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Role Sistem
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.system}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                    <Key className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Role Kustom
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.custom}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                                    <Users className="size-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                        Pengguna Terikat
                                    </p>
                                    <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {stats.totalUsers}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearchSubmit} className="relative flex w-full max-w-sm items-center">
                        <Search className="text-muted-foreground absolute left-3 size-4 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Cari label, slug, atau deskripsi..."
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
                    </form>

                    {isFiltered && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="gap-1 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                        >
                            <X className="size-3.5" />
                            Reset Pencarian
                        </Button>
                    )}
                </div>

                {/* Table */}
                <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-950">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">No</TableHead>
                                <TableHead className="min-w-[180px]">Role & Identifier</TableHead>
                                <TableHead className="min-w-[200px]">Deskripsi</TableHead>
                                <TableHead className="min-w-[260px]">Hak Akses Menu & Aksi</TableHead>
                                <TableHead className="w-28 text-center">Pengguna</TableHead>
                                <TableHead className="w-24 text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-44 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
                                            <Shield className="size-10 opacity-30" />
                                            <p className="font-medium">Tidak ada data role ditemukan.</p>
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
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleOpenCreate}
                                                    className="mt-2"
                                                >
                                                    <Plus className="mr-1.5 size-3.5" />
                                                    Tambah Role Pertama
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role, index) => {
                                    const isSuperAdmin =
                                        role.name === 'superadmin' || role.permissions.includes('*');
                                    const canDelete = !role.is_system && role.users_count === 0;

                                    const readCount = role.permissions.filter((p) => p.endsWith('.read')).length;
                                    const writeCount = role.permissions.filter((p) => p.endsWith('.write')).length;
                                    const deleteCount = role.permissions.filter((p) => p.endsWith('.delete')).length;
                                    const hasGranular = readCount > 0 || writeCount > 0 || deleteCount > 0;

                                    return (
                                        <TableRow key={role.id}>
                                            <TableCell className="text-center font-medium text-neutral-500 dark:text-neutral-400">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {role.label}
                                                        </span>
                                                        {role.is_system ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-purple-200 bg-purple-50 text-[10px] text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300"
                                                            >
                                                                Sistem
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                            >
                                                                Kustom
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {role.name}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                                                    {role.description || '-'}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {isSuperAdmin ? (
                                                    <Badge className="border-purple-200 bg-purple-100 text-xs font-medium text-purple-800 dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                                                        <ShieldCheck className="mr-1 size-3.5" />
                                                        Akses Penuh (Semua Modul)
                                                    </Badge>
                                                ) : (
                                                    <div className="flex flex-col gap-1.5">
                                                        {hasGranular && (
                                                            <div className="flex flex-wrap items-center gap-1">
                                                                {readCount > 0 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                                    >
                                                                        <Eye className="mr-1 size-2.5" />
                                                                        {readCount} Read
                                                                    </Badge>
                                                                )}
                                                                {writeCount > 0 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-blue-200 bg-blue-50 text-[10px] text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                                                                    >
                                                                        <Pencil className="mr-1 size-2.5" />
                                                                        {writeCount} Write
                                                                    </Badge>
                                                                )}
                                                                {deleteCount > 0 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="border-rose-200 bg-rose-50 text-[10px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                                                    >
                                                                        <Trash2 className="mr-1 size-2.5" />
                                                                        {deleteCount} Delete
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5">
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-xs font-semibold"
                                                            >
                                                                {role.permissions.length} Hak Akses
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[11px] text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                onClick={() => setActivePermissionPreview(role)}
                                                            >
                                                                Lihat Detail
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={role.users_count > 0 ? 'default' : 'secondary'}
                                                    className="font-mono text-xs"
                                                >
                                                    {role.users_count} User
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                                        onClick={() => handleOpenEdit(role)}
                                                        title="Edit Role & Hak Akses"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={!canDelete}
                                                        className="size-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                                        onClick={() => handleOpenDelete(role)}
                                                        title={
                                                            role.is_system
                                                                ? 'Role bawaan sistem tidak dapat dihapus'
                                                                : role.users_count > 0
                                                                  ? `Role digunakan oleh ${role.users_count} user`
                                                                  : 'Hapus Role'
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Dialog Preview Permissions */}
            <Dialog
                open={activePermissionPreview !== null}
                onOpenChange={(open) => !open && setActivePermissionPreview(null)}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Daftar Hak Akses: {activePermissionPreview?.label}
                        </DialogTitle>
                        <DialogDescription>
                            Daftar modul, menu, dan aksi granular (Read, Write, Delete) yang dapat diakses oleh role ini ({activePermissionPreview?.name}).
                        </DialogDescription>
                    </DialogHeader>

                    {activePermissionPreview && (
                        <div className="mt-2 space-y-4">
                            {activePermissionPreview.permissions.includes('*') ? (
                                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-900 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200">
                                    <p className="font-semibold">Akses Administrator Penuh</p>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">
                                        Role ini memiliki izin mutlak untuk melihat, membuat, mengubah, dan menghapus seluruh modul dalam sistem.
                                    </p>
                                </div>
                            ) : (
                                Object.entries(groupedPermissions).map(([groupName, groupData]) => {
                                    const groupActions = groupData.features.flatMap((f) => f.actions);
                                    const activeGroupActions = groupActions.filter(
                                        (a) =>
                                            activePermissionPreview.permissions.includes(a.key) ||
                                            activePermissionPreview.permissions.some(
                                                (p) => p !== '' && a.key.startsWith(p + '.'),
                                            ),
                                    );

                                    return (
                                        <div
                                            key={groupName}
                                            className="rounded-xl border border-neutral-200/80 p-3.5 dark:border-neutral-800"
                                        >
                                            <div className="mb-2.5 flex items-center justify-between border-b pb-2 dark:border-neutral-800">
                                                <span className="font-bold text-sm text-neutral-800 dark:text-neutral-200">
                                                    Modul {groupName}
                                                </span>
                                                <Badge
                                                    variant={activeGroupActions.length > 0 ? 'default' : 'secondary'}
                                                    className="text-[10px]"
                                                >
                                                    {activeGroupActions.length} dari {groupActions.length} aksi diizinkan
                                                </Badge>
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                {groupData.features.map((feat) => {
                                                    const activeFeatActions = feat.actions.filter(
                                                        (a) =>
                                                            activePermissionPreview.permissions.includes(a.key) ||
                                                            activePermissionPreview.permissions.some(
                                                                (p) => p !== '' && a.key.startsWith(p + '.'),
                                                            ),
                                                    );
                                                    const hasAny = activeFeatActions.length > 0;

                                                    return (
                                                        <div
                                                            key={feat.feature}
                                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                                                                hasAny
                                                                    ? 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
                                                                    : 'border-neutral-100 bg-neutral-50/60 text-neutral-400 opacity-60 dark:border-neutral-800/50 dark:bg-neutral-950/40 dark:text-neutral-500'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {hasAny ? (
                                                                    <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                                ) : (
                                                                    <X className="size-4 shrink-0 text-neutral-400" />
                                                                )}
                                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {feat.feature}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-1.5 pl-6 sm:pl-0">
                                                                {feat.actions.map((act) => {
                                                                    const isGranted =
                                                                        activePermissionPreview.permissions.includes(act.key) ||
                                                                        activePermissionPreview.permissions.some(
                                                                            (p) => p !== '' && act.key.startsWith(p + '.'),
                                                                        );

                                                                    let colorClass = '';
                                                                    if (act.action === 'read') {
                                                                        colorClass = isGranted
                                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                                                            : 'bg-neutral-100 text-neutral-400 opacity-50 dark:bg-neutral-800';
                                                                    } else if (act.action === 'write') {
                                                                        colorClass = isGranted
                                                                            ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                                                                            : 'bg-neutral-100 text-neutral-400 opacity-50 dark:bg-neutral-800';
                                                                    } else if (act.action === 'delete') {
                                                                        colorClass = isGranted
                                                                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                                                                            : 'bg-neutral-100 text-neutral-400 opacity-50 dark:bg-neutral-800';
                                                                    } else {
                                                                        colorClass = isGranted
                                                                            ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300'
                                                                            : 'bg-neutral-100 text-neutral-400 opacity-50 dark:bg-neutral-800';
                                                                    }

                                                                    return (
                                                                        <span
                                                                            key={act.key}
                                                                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-semibold ${colorClass}`}
                                                                        >
                                                                            {act.label}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
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

            {/* Dialog Tambah Role */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Tambah Role Baru
                        </DialogTitle>
                        <DialogDescription>
                            Buat role baru dan atur izin hak akses modul (Read, Write, Delete) untuk pengguna sistem.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCreateSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="create-label" className="text-xs font-semibold">
                                    Nama Role (Tampilan) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-label"
                                    placeholder="Contoh: Staff Marketing"
                                    value={createForm.data.label}
                                    onChange={(e) => handleLabelChangeCreate(e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.label} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="create-name" className="text-xs font-semibold">
                                    Identifier Teknis (Slug) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="create-name"
                                    placeholder="Contoh: staff_marketing"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/[^a-z0-9_-]/g, ''),
                                        )
                                    }
                                    required
                                />
                                <InputError message={createForm.errors.name} />
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Hanya huruf kecil, angka, dan garis bawah (_).
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="create-description" className="text-xs font-semibold">
                                Deskripsi Role
                            </Label>
                            <Input
                                id="create-description"
                                placeholder="Jelaskan peran atau tanggung jawab pengguna dengan role ini..."
                                value={createForm.data.description}
                                onChange={(e) => createForm.setData('description', e.target.value)}
                            />
                            <InputError message={createForm.errors.description} />
                        </div>

                        {/* Kontrol Hak Akses Matrix */}
                        <PermissionControlMatrix
                            groupedPermissions={groupedPermissions}
                            selectedPermissions={createForm.data.permissions}
                            allPermissionKeys={allPermissionKeys}
                            onChange={(next) => createForm.setData('permissions', next)}
                            error={createForm.errors.permissions}
                        />

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={createForm.processing}
                                >
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {createForm.processing && <Spinner className="mr-2 size-4" />}
                                Simpan Role
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Edit Role */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="size-5 text-indigo-600 dark:text-indigo-400" />
                            Edit Role & Hak Akses
                        </DialogTitle>
                        <DialogDescription>
                            Perbarui informasi role{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedRole?.label}
                            </span>{' '}
                            ({selectedRole?.name}) dan atur hak aksesnya.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit-label" className="text-xs font-semibold">
                                    Nama Role (Tampilan) <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="edit-label"
                                    value={editForm.data.label}
                                    onChange={(e) => editForm.setData('label', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.label} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Identifier Teknis (Slug)</Label>
                                <Input
                                    value={selectedRole?.name || ''}
                                    disabled
                                    className="bg-neutral-100 font-mono text-xs dark:bg-neutral-800"
                                />
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                    Identifier teknis tidak dapat diubah untuk menjaga integritas data user.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-description" className="text-xs font-semibold">
                                Deskripsi Role
                            </Label>
                            <Input
                                id="edit-description"
                                value={editForm.data.description}
                                onChange={(e) => editForm.setData('description', e.target.value)}
                            />
                            <InputError message={editForm.errors.description} />
                        </div>

                        {/* Kontrol Hak Akses Matrix */}
                        {selectedRole?.name === 'superadmin' ? (
                            <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 dark:border-purple-800 dark:bg-purple-950/40">
                                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                                    <ShieldCheck className="size-5 shrink-0" />
                                    <p className="font-semibold text-sm">
                                        Role Superadmin Memiliki Hak Akses Penuh
                                    </p>
                                </div>
                                <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                                    Role ini secara otomatis memiliki izin (* / wildcard) ke seluruh menu dan modul sistem, dan tidak dibatasi oleh konfigurasi individual.
                                </p>
                            </div>
                        ) : (
                            <PermissionControlMatrix
                                groupedPermissions={groupedPermissions}
                                selectedPermissions={editForm.data.permissions}
                                allPermissionKeys={allPermissionKeys}
                                onChange={(next) => editForm.setData('permissions', next)}
                                error={editForm.errors.permissions}
                            />
                        )}

                        <DialogFooter className="mt-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={editForm.processing}
                                >
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

            {/* Dialog Hapus Role */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <ShieldAlert className="size-5" />
                            Hapus Role
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus role{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {selectedRole?.label} ({selectedRole?.name})
                            </span>
                            ? Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRole?.is_system ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                            <p className="font-semibold">Role Sistem Dilindungi</p>
                            <p>Role bawaan sistem tidak dapat dihapus demi keamanan dan kestabilan aplikasi.</p>
                        </div>
                    ) : (selectedRole?.users_count ?? 0) > 0 ? (
                        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
                            <p className="font-semibold">Role Masih Digunakan</p>
                            <p>
                                Role ini masih digunakan oleh{' '}
                                <span className="font-bold">{selectedRole?.users_count} pengguna</span>. Pindahkan pengguna ke role lain terlebih dahulu sebelum menghapus role ini.
                            </p>
                        </div>
                    ) : null}

                    <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={deleteForm.processing}
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={
                                deleteForm.processing ||
                                selectedRole?.is_system ||
                                (selectedRole?.users_count ?? 0) > 0
                            }
                        >
                            {deleteForm.processing && <Spinner className="mr-2 size-4" />}
                            Hapus Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Channel',
            href: dashboard(),
        },
        {
            title: 'Role & Hak Akses',
            href: rolesRoute.index(),
        },
    ],
};
