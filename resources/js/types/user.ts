import type { Dealer } from './dealer';

export type UserRole = 'superadmin' | 'spv' | 'kabag' | 'dealer';

export interface RoleOption {
    value: UserRole;
    label: string;
}

export interface UserItem {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    dealer_id: number | null;
    dealer?: Dealer | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedUsers {
    data: UserItem[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

