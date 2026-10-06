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
     * Available system permissions categorized by module.
     *
     * @var array<string, array{group: string, label: string, description: string}>
     */
    public const AVAILABLE_PERMISSIONS = [
        // Group PCD
        'pcd.dashboard' => [
            'group' => 'PCD',
            'label' => 'Dashboard Channel',
            'description' => 'Akses halaman Dashboard Channel PCD',
        ],
        'pcd.channel' => [
            'group' => 'PCD',
            'label' => 'Channel (Pameran)',
            'description' => 'Lihat dan kelola data Channel/Pameran',
        ],
        'pcd.channel_approval_spv' => [
            'group' => 'PCD',
            'label' => 'Approval SPV Channel',
            'description' => 'Menyetujui pameran pada tahap SPV',
        ],
        'pcd.channel_approval_kabag' => [
            'group' => 'PCD',
            'label' => 'Approval Kabag Channel',
            'description' => 'Menyetujui pameran pada tahap Kabag',
        ],
        'pcd.jenis_channel' => [
            'group' => 'PCD',
            'label' => 'Jenis Channel',
            'description' => 'Kelola master data Jenis Channel/Pameran',
        ],
        'pcd.meet_and_greet' => [
            'group' => 'PCD',
            'label' => 'Meet & Greet',
            'description' => 'Kelola data dan formulir Meet & Greet Honda',
        ],

        // Group Marketing
        'marketing.dashboard' => [
            'group' => 'Marketing',
            'label' => 'Dashboard Marketing',
            'description' => 'Akses ringkasan statistik dan grafik Marketing',
        ],
        'marketing.r2' => [
            'group' => 'Marketing',
            'label' => 'Data R2 & Import',
            'description' => 'Akses data R2 dan import spreadsheet penjualan',
        ],

        // Group Master Data
        'master_data.access' => [
            'group' => 'Master Data',
            'label' => 'Master Data (Semua)',
            'description' => 'Kelola Segment, Brand, Kategori, Kabupaten, dan Type',
        ],

        // Group Management
        'management.dealers' => [
            'group' => 'Management',
            'label' => 'Kelola Dealer',
            'description' => 'Tambah, ubah, dan hapus master data Dealer',
        ],
        'management.users' => [
            'group' => 'Management',
            'label' => 'Kelola User',
            'description' => 'Kelola akun pengguna dan penugasan role',
        ],
        'management.roles' => [
            'group' => 'Management',
            'label' => 'Kelola Role & Akses',
            'description' => 'Kelola role baru dan kontrol hak akses menu',
        ],
    ];

    /**
     * Get structured permissions grouped by module.
     *
     * @return array<string, array<string, array{key: string, label: string, description: string}>>
     */
    public static function getGroupedPermissions(): array
    {
        $grouped = [];

        foreach (self::AVAILABLE_PERMISSIONS as $key => $perm) {
            $group = $perm['group'];
            if (! isset($grouped[$group])) {
                $grouped[$group] = [];
            }
            $grouped[$group][] = [
                'key' => $key,
                'label' => $perm['label'],
                'description' => $perm['description'],
            ];
        }

        return $grouped;
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

        return in_array($permission, $perms, true);
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
