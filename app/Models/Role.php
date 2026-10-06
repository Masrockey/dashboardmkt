<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = [
        'name',
        'label',
        'description',
        'permissions',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    /**
     * Available system permissions categorized by module, feature, and action (Read, Write, Delete, etc.).
     *
     * @var array<string, array{group: string, feature: string, action: string, label: string, description: string}>
     */
    public const AVAILABLE_PERMISSIONS = [
        // ==================== PCD ====================
        'pcd.dashboard.read' => [
            'group' => 'PCD',
            'feature' => 'Dashboard Channel',
            'action' => 'read',
            'label' => 'Lihat Dashboard',
            'description' => 'Melihat ringkasan statistik dan grafik pameran PCD',
        ],
        'pcd.channel.read' => [
            'group' => 'PCD',
            'feature' => 'Channel (Pameran)',
            'action' => 'read',
            'label' => 'Lihat Channel',
            'description' => 'Melihat daftar dan rincian pengajuan pameran',
        ],
        'pcd.channel.write' => [
            'group' => 'PCD',
            'feature' => 'Channel (Pameran)',
            'action' => 'write',
            'label' => 'Tambah & Edit Channel',
            'description' => 'Membuat dan memperbarui data pameran',
        ],
        'pcd.channel.delete' => [
            'group' => 'PCD',
            'feature' => 'Channel (Pameran)',
            'action' => 'delete',
            'label' => 'Hapus Channel',
            'description' => 'Menghapus data pameran channel',
        ],
        'pcd.channel.approval_spv' => [
            'group' => 'PCD',
            'feature' => 'Channel (Pameran)',
            'action' => 'approval',
            'label' => 'Approval SPV',
            'description' => 'Menyetujui pameran pada tahap SPV',
        ],
        'pcd.channel.approval_kabag' => [
            'group' => 'PCD',
            'feature' => 'Channel (Pameran)',
            'action' => 'approval',
            'label' => 'Approval Kabag',
            'description' => 'Menyetujui pameran pada tahap Kabag',
        ],
        'pcd.jenis_channel.read' => [
            'group' => 'PCD',
            'feature' => 'Jenis Channel',
            'action' => 'read',
            'label' => 'Lihat Jenis Channel',
            'description' => 'Melihat daftar jenis pameran/channel',
        ],
        'pcd.jenis_channel.write' => [
            'group' => 'PCD',
            'feature' => 'Jenis Channel',
            'action' => 'write',
            'label' => 'Tambah & Edit Jenis Channel',
            'description' => 'Menambah atau memperbarui jenis channel',
        ],
        'pcd.jenis_channel.delete' => [
            'group' => 'PCD',
            'feature' => 'Jenis Channel',
            'action' => 'delete',
            'label' => 'Hapus Jenis Channel',
            'description' => 'Menghapus master data jenis channel',
        ],
        'pcd.meet_and_greet.read' => [
            'group' => 'PCD',
            'feature' => 'Meet & Greet',
            'action' => 'read',
            'label' => 'Lihat Meet & Greet',
            'description' => 'Melihat data pendaftaran Meet & Greet',
        ],
        'pcd.meet_and_greet.write' => [
            'group' => 'PCD',
            'feature' => 'Meet & Greet',
            'action' => 'write',
            'label' => 'Tambah & Edit Meet & Greet',
            'description' => 'Menambah data konsumen & mengatur form',
        ],
        'pcd.meet_and_greet.delete' => [
            'group' => 'PCD',
            'feature' => 'Meet & Greet',
            'action' => 'delete',
            'label' => 'Hapus Meet & Greet',
            'description' => 'Menghapus data pendaftar Meet & Greet',
        ],

        // ==================== PROMOSI ====================
        'promosi.atl.read' => [
            'group' => 'Promosi',
            'feature' => 'ATL (Above The Line)',
            'action' => 'read',
            'label' => 'Lihat Promosi ATL',
            'description' => 'Melihat materi promosi media ATL',
        ],
        'promosi.atl.write' => [
            'group' => 'Promosi',
            'feature' => 'ATL (Above The Line)',
            'action' => 'write',
            'label' => 'Tambah & Edit ATL',
            'description' => 'Membuat dan memperbarui promosi ATL',
        ],
        'promosi.atl.delete' => [
            'group' => 'Promosi',
            'feature' => 'ATL (Above The Line)',
            'action' => 'delete',
            'label' => 'Hapus ATL',
            'description' => 'Menghapus data promosi ATL',
        ],
        'promosi.btl.read' => [
            'group' => 'Promosi',
            'feature' => 'BTL (Below The Line)',
            'action' => 'read',
            'label' => 'Lihat Promosi BTL',
            'description' => 'Melihat event dan aktivasi promosi BTL',
        ],
        'promosi.btl.write' => [
            'group' => 'Promosi',
            'feature' => 'BTL (Below The Line)',
            'action' => 'write',
            'label' => 'Tambah & Edit BTL',
            'description' => 'Membuat dan memperbarui kegiatan BTL',
        ],
        'promosi.btl.delete' => [
            'group' => 'Promosi',
            'feature' => 'BTL (Below The Line)',
            'action' => 'delete',
            'label' => 'Hapus BTL',
            'description' => 'Menghapus data kegiatan promosi BTL',
        ],

        // ==================== MARKETING ====================
        'marketing.dashboard.read' => [
            'group' => 'Marketing',
            'feature' => 'Dashboard Marketing',
            'action' => 'read',
            'label' => 'Lihat Dashboard',
            'description' => 'Melihat statistik & grafik performa marketing',
        ],
        'marketing.r2.read' => [
            'group' => 'Marketing',
            'feature' => 'Data R2 & Penjualan',
            'action' => 'read',
            'label' => 'Lihat Data R2',
            'description' => 'Melihat tabel penjualan R2',
        ],
        'marketing.r2.write' => [
            'group' => 'Marketing',
            'feature' => 'Data R2 & Penjualan',
            'action' => 'write',
            'label' => 'Tambah, Edit & Import R2',
            'description' => 'Menginput data penjualan & import spreadsheet',
        ],
        'marketing.r2.delete' => [
            'group' => 'Marketing',
            'feature' => 'Data R2 & Penjualan',
            'action' => 'delete',
            'label' => 'Hapus Data R2',
            'description' => 'Menghapus data penjualan R2',
        ],

        // ==================== MASTER DATA ====================
        'master_data.segments.read' => [
            'group' => 'Master Data',
            'feature' => 'Segment',
            'action' => 'read',
            'label' => 'Lihat Segment',
            'description' => 'Melihat master data Segment',
        ],
        'master_data.segments.write' => [
            'group' => 'Master Data',
            'feature' => 'Segment',
            'action' => 'write',
            'label' => 'Tambah & Edit Segment',
            'description' => 'Menambah atau memperbarui Segment',
        ],
        'master_data.segments.delete' => [
            'group' => 'Master Data',
            'feature' => 'Segment',
            'action' => 'delete',
            'label' => 'Hapus Segment',
            'description' => 'Menghapus data Segment',
        ],
        'master_data.brands.read' => [
            'group' => 'Master Data',
            'feature' => 'Brand',
            'action' => 'read',
            'label' => 'Lihat Brand',
            'description' => 'Melihat master data Brand',
        ],
        'master_data.brands.write' => [
            'group' => 'Master Data',
            'feature' => 'Brand',
            'action' => 'write',
            'label' => 'Tambah & Edit Brand',
            'description' => 'Menambah atau memperbarui Brand',
        ],
        'master_data.brands.delete' => [
            'group' => 'Master Data',
            'feature' => 'Brand',
            'action' => 'delete',
            'label' => 'Hapus Brand',
            'description' => 'Menghapus data Brand',
        ],
        'master_data.categories.read' => [
            'group' => 'Master Data',
            'feature' => 'Kategori',
            'action' => 'read',
            'label' => 'Lihat Kategori',
            'description' => 'Melihat master data Kategori',
        ],
        'master_data.categories.write' => [
            'group' => 'Master Data',
            'feature' => 'Kategori',
            'action' => 'write',
            'label' => 'Tambah & Edit Kategori',
            'description' => 'Menambah atau memperbarui Kategori',
        ],
        'master_data.categories.delete' => [
            'group' => 'Master Data',
            'feature' => 'Kategori',
            'action' => 'delete',
            'label' => 'Hapus Kategori',
            'description' => 'Menghapus data Kategori',
        ],
        'master_data.kabupatens.read' => [
            'group' => 'Master Data',
            'feature' => 'Kabupaten',
            'action' => 'read',
            'label' => 'Lihat Kabupaten',
            'description' => 'Melihat master data Kabupaten',
        ],
        'master_data.kabupatens.write' => [
            'group' => 'Master Data',
            'feature' => 'Kabupaten',
            'action' => 'write',
            'label' => 'Tambah & Edit Kabupaten',
            'description' => 'Menambah atau memperbarui Kabupaten',
        ],
        'master_data.kabupatens.delete' => [
            'group' => 'Master Data',
            'feature' => 'Kabupaten',
            'action' => 'delete',
            'label' => 'Hapus Kabupaten',
            'description' => 'Menghapus data Kabupaten',
        ],
        'master_data.types.read' => [
            'group' => 'Master Data',
            'feature' => 'Type Motor',
            'action' => 'read',
            'label' => 'Lihat Type',
            'description' => 'Melihat master data Type sepeda motor',
        ],
        'master_data.types.write' => [
            'group' => 'Master Data',
            'feature' => 'Type Motor',
            'action' => 'write',
            'label' => 'Tambah & Edit Type',
            'description' => 'Menambah atau memperbarui Type motor',
        ],
        'master_data.types.delete' => [
            'group' => 'Master Data',
            'feature' => 'Type Motor',
            'action' => 'delete',
            'label' => 'Hapus Type',
            'description' => 'Menghapus data Type sepeda motor',
        ],

        // ==================== MANAGEMENT ====================
        'management.dealers.read' => [
            'group' => 'Management',
            'feature' => 'Dealer',
            'action' => 'read',
            'label' => 'Lihat Dealer',
            'description' => 'Melihat master data Dealer',
        ],
        'management.dealers.write' => [
            'group' => 'Management',
            'feature' => 'Dealer',
            'action' => 'write',
            'label' => 'Tambah & Edit Dealer',
            'description' => 'Menambah dan mengubah Dealer',
        ],
        'management.dealers.delete' => [
            'group' => 'Management',
            'feature' => 'Dealer',
            'action' => 'delete',
            'label' => 'Hapus Dealer',
            'description' => 'Menghapus data Dealer',
        ],
        'management.users.read' => [
            'group' => 'Management',
            'feature' => 'User',
            'action' => 'read',
            'label' => 'Lihat User',
            'description' => 'Melihat daftar akun pengguna',
        ],
        'management.users.write' => [
            'group' => 'Management',
            'feature' => 'User',
            'action' => 'write',
            'label' => 'Tambah & Edit User',
            'description' => 'Menambah dan memperbarui data user & role',
        ],
        'management.users.delete' => [
            'group' => 'Management',
            'feature' => 'User',
            'action' => 'delete',
            'label' => 'Hapus User',
            'description' => 'Menghapus akun pengguna',
        ],
        'management.roles.read' => [
            'group' => 'Management',
            'feature' => 'Role & Hak Akses',
            'action' => 'read',
            'label' => 'Lihat Role',
            'description' => 'Melihat daftar role dan hak akses',
        ],
        'management.roles.write' => [
            'group' => 'Management',
            'feature' => 'Role & Hak Akses',
            'action' => 'write',
            'label' => 'Tambah & Edit Role',
            'description' => 'Membuat dan mengubah hak akses role',
        ],
        'management.roles.delete' => [
            'group' => 'Management',
            'feature' => 'Role & Hak Akses',
            'action' => 'delete',
            'label' => 'Hapus Role',
            'description' => 'Menghapus role kustom',
        ],
    ];

    /**
     * Get structured permissions grouped by module and feature.
     *
     * @return array<string, array{group: string, features: array<int, array{feature: string, actions: array<int, array{key: string, action: string, label: string, description: string}>}>}>
     */
    public static function getGroupedPermissions(): array
    {
        $grouped = [];

        foreach (self::AVAILABLE_PERMISSIONS as $key => $perm) {
            $group = $perm['group'];
            $feature = $perm['feature'];

            if (! isset($grouped[$group])) {
                $grouped[$group] = [
                    'group' => $group,
                    'features' => [],
                ];
            }

            if (! isset($grouped[$group]['features'][$feature])) {
                $grouped[$group]['features'][$feature] = [
                    'feature' => $feature,
                    'actions' => [],
                ];
            }

            $grouped[$group]['features'][$feature]['actions'][] = [
                'key' => $key,
                'action' => $perm['action'],
                'label' => $perm['label'],
                'description' => $perm['description'],
            ];
        }

        $result = [];
        foreach ($grouped as $groupName => $groupData) {
            $result[$groupName] = [
                'group' => $groupName,
                'features' => array_values($groupData['features']),
            ];
        }

        return $result;
    }

    /**
     * Get list of all allowed permission keys, including wildcard and legacy keys.
     *
     * @return array<int, string>
     */
    public static function getAllowedPermissionKeys(): array
    {
        return array_values(array_unique(array_merge(['*'], array_keys(self::AVAILABLE_PERMISSIONS), [
            'pcd.dashboard',
            'pcd.channel',
            'pcd.channel_approval_spv',
            'pcd.channel_approval_kabag',
            'pcd.channel.approval_spv',
            'pcd.channel.approval_kabag',
            'pcd.jenis_channel',
            'pcd.meet_and_greet',
            'promosi.atl',
            'promosi.btl',
            'marketing.dashboard',
            'marketing.r2',
            'master_data.access',
            'management.dealers',
            'management.users',
            'management.roles',
        ])));
    }

    /**
     * Check if this role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        $perms = $this->permissions ?? [];

        if (in_array('*', $perms, true)) {
            return true;
        }

        if (in_array($permission, $perms, true)) {
            return true;
        }

        // Backward compatibility:
        // 1. If role has broad permission (e.g. 'pcd.channel'), grant any child action ('pcd.channel.read', 'pcd.channel.write')
        foreach ($perms as $p) {
            if ($p !== '' && str_starts_with($permission, $p.'.')) {
                return true;
            }
        }

        // 2. If checking broad permission (e.g. 'pcd.channel' for sidebar/menu check), grant if role has any child action
        foreach ($perms as $p) {
            if ($p !== '' && str_starts_with($p, $permission.'.')) {
                return true;
            }
        }

        // 3. Special mapping for legacy 'master_data.access'
        if (in_array('master_data.access', $perms, true) && str_starts_with($permission, 'master_data.')) {
            return true;
        }

        return false;
    }

    /**
     * Get count of users currently assigned this role.
     */
    public function getUsersCountAttribute(): int
    {
        return User::where(function ($query) {
            $query->whereJsonContains('roles', $this->name)
                ->orWhere('role', $this->name);
        })->count();
    }
}
