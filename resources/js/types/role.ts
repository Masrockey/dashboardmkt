export type PermissionActionType = 'read' | 'write' | 'delete' | 'approval' | string;

export interface PermissionAction {
    key: string;
    action: PermissionActionType;
    label: string;
    description: string;
}

export interface PermissionFeature {
    feature: string;
    actions: PermissionAction[];
}

export interface PermissionGroup {
    group: string;
    features: PermissionFeature[];
}

export type GroupedPermissions = Record<string, PermissionGroup>;

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
