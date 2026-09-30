export interface Kabupaten {
    id: number;
    nama_kabupaten: string;
    created_at: string;
    updated_at: string;
}

export interface PaginatedKabupatens {
    data: Kabupaten[];
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
