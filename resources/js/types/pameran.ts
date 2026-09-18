import type { Dealer } from './dealer';
import type { JenisPameran } from './jenis-pameran';

export interface PameranItem {
    id: number;
    dealer_id: number;
    dealer: Dealer;
    jenis_pameran_id: number;
    jenis_pameran: JenisPameran;
    kode_pameran_md: string;
    kode_pameran_ahm: string | null;
    mulai_tanggal_sewa: string;
    tanggal_sewa_berakhir: string;
    kecamatan: string;
    detail_alamat: string;
    latitude: number | null;
    longitude: number | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedPameran {
    data: PameranItem[];
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

