export interface PermissionItem {
    key: string;
    label: string;
    description: string;
}

export type GroupedPermissions = Record<string, PermissionItem[]>;

export interface RoleItem {
    id: number;
    name: string;
    label: string;
    description: string | null;
    permissions: string[];
    is_system: boolean;
    users_count: number;
    created_at?: string;
    updated_at?: string;
}
