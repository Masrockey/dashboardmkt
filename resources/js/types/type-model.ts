import type { Segment } from './segment';

export interface TypeItem {
    id: number;
    nama_type: string;
    segment_id: number | null;
    segment?: Segment | null;
    nama_pasar: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedTypes {
    data: TypeItem[];
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
