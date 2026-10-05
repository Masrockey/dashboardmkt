import type { Dealer } from './dealer';

export interface MeetAndGreetItem {
    id: number;
    no_registrasi: string;
    dealer_id: number;
    nama_konsumen: string;
    alamat: string;
    no_hp: string;
    tipe_motor: string;
    no_plat: string;
    stnk_path: string | null;
    stnk_url: string | null;
    created_by_user_id: number | null;
    created_at: string;
    updated_at: string;
    dealer?: Dealer;
    created_by_user?: {
        id: number;
        name: string;
    };
}

export interface PaginatedMeetAndGreets {
    data: MeetAndGreetItem[];
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
