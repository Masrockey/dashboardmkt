<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class R2UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'drv_desc' => ['nullable', 'string', 'max:255'],
            'knd_nopol' => ['nullable', 'string', 'max:255'],
            'knd_nama' => ['nullable', 'string', 'max:255'],
            'knd_alamat' => ['nullable', 'string'],
            'kel_desc' => ['nullable', 'string', 'max:255'],
            'kec_desc' => ['nullable', 'string', 'max:255'],
            'kab_desc' => ['nullable', 'string', 'max:255'],
            'jns_desc' => ['nullable', 'string', 'max:255'],
            'mrk_desc' => ['nullable', 'string', 'max:255'],
            'pkb_desc' => ['nullable', 'string', 'max:255'],
            'knd_thn_buat' => ['nullable', 'string', 'max:255'],
            'knd_cyl' => ['nullable', 'string', 'max:255'],
            'knd_rangka' => ['nullable', 'string', 'max:255'],
            'knd_mesin' => ['nullable', 'string', 'max:255'],
            'knd_warna' => ['nullable', 'string', 'max:255'],
            'guna_desc' => ['nullable', 'string', 'max:255'],
            'wrn_desc' => ['nullable', 'string', 'max:255'],
            'ctk_notice_tanggal' => ['nullable', 'date'],
            'ctk_notice_seri' => ['nullable', 'string', 'max:255'],
            'knd_tgl_notice_new' => ['nullable', 'date'],
            'knd_tgl_notice_old' => ['nullable', 'date'],
            'knd_df_jenis' => ['nullable', 'string', 'max:255'],
        ];
    }
}
