export interface R2 {
    id: number;
    drv_desc: string | null;
    knd_nopol: string | null;
    knd_nama: string | null;
    knd_alamat: string | null;
    kel_desc: string | null;
    kec_desc: string | null;
    kab_desc: string | null;
    jns_desc: string | null;
    mrk_desc: string | null;
    pkb_desc: string | null;
    knd_thn_buat: string | null;
    knd_cyl: string | null;
    knd_rangka: string | null;
    knd_mesin: string | null;
    knd_warna: string | null;
    guna_desc: string | null;
    wrn_desc: string | null;
    ctk_notice_tanggal: string | null;
    ctk_notice_seri: string | null;
    knd_tgl_notice_new: string | null;
    knd_tgl_notice_old: string | null;
    knd_df_jenis: string | null;
    model: string | null;
    roda: string | null;
    type: string | null;
    segment: string | null;
    nama_pasar: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedR2s {
    data: R2[];
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

export type PaginatedR2 = PaginatedR2s;

export type R2FormData = {
    drv_desc: string;
    knd_nopol: string;
    knd_nama: string;
    knd_alamat: string;
    kel_desc: string;
    kec_desc: string;
    kab_desc: string;
    jns_desc: string;
    mrk_desc: string;
    pkb_desc: string;
    knd_thn_buat: string;
    knd_cyl: string;
    knd_rangka: string;
    knd_mesin: string;
    knd_warna: string;
    guna_desc: string;
    wrn_desc: string;
    ctk_notice_tanggal: string;
    ctk_notice_seri: string;
    knd_tgl_notice_new: string;
    knd_tgl_notice_old: string;
    knd_df_jenis: string;
    model: string;
    roda: string;
    type: string;
    segment: string;
    nama_pasar: string;
};

