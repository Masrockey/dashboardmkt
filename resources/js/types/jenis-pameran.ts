export interface JenisPameran {
    id: number;
    kode_pameran: string;
    jenis_pameran: string;
    icon_map: string | null;
    icon_map_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedJenisPameran {
    data: JenisPameran[];
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

