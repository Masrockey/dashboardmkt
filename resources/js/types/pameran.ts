import type { Dealer } from './dealer';
import type { JenisPameran } from './jenis-pameran';

export type PameranStatus = 'menunggu_spv' | 'menunggu_kabag' | 'disetujui' | 'ditolak';

export interface PameranItem {
    id: number;
    dealer_id: number;
    dealer: Dealer;
    jenis_pameran_id: number;
    jenis_pameran: JenisPameran;
    kode_pameran_md: string | null;
    kode_pameran_ahm: string | null;
    mulai_tanggal_sewa: string;
    tanggal_sewa_berakhir: string;
    kecamatan: string;
    detail_alamat: string;
    latitude: number | null;
    longitude: number | null;
    status: PameranStatus;
    created_by_user_id?: number | null;
    creator?: { id: number; name: string } | null;
    spv_approved_by?: number | null;
    spv_approved_at?: string | null;
    spv_approver?: { id: number; name: string } | null;
    kabag_approved_by?: number | null;
    kabag_approved_at?: string | null;
    kabag_approver?: { id: number; name: string } | null;
    catatan_penolakan?: string | null;
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

