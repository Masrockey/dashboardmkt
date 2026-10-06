export type BillboardLampStatus = 'menyala' | 'mati' | 'tanpa_lampu';

export type BillboardPhysicalStatus = 'baik' | 'rusak_ringan' | 'rusak_berat';

export type BillboardPhotoField =
    | 'foto_siang'
    | 'foto_malam'
    | 'foto_jarak_jauh'
    | 'foto_jarak_dekat';

export interface Billboard {
    id: number;
    lokasi: string;
    latitude: number;
    longitude: number;
    ukuran: string;
    tanggal_pasang: string;
    tanggal_berakhir: string | null;
    status_lampu: BillboardLampStatus;
    status_fisik: BillboardPhysicalStatus;
    foto_siang: string | null;
    foto_malam: string | null;
    foto_jarak_jauh: string | null;
    foto_jarak_dekat: string | null;
    foto_siang_url: string | null;
    foto_malam_url: string | null;
    foto_jarak_jauh_url: string | null;
    foto_jarak_dekat_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface BillboardStatusOption {
    value: string;
    label: string;
}

export interface PaginatedBillboards {
    data: Billboard[];
    current_page: number;
    from: number | null;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    per_page: number;
    to: number | null;
    total: number;
}
