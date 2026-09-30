<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class R2 extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'r2s';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'drv_desc',
        'knd_nopol',
        'knd_nama',
        'knd_alamat',
        'kel_desc',
        'kec_desc',
        'kab_desc',
        'jns_desc',
        'mrk_desc',
        'pkb_desc',
        'knd_thn_buat',
        'knd_cyl',
        'knd_rangka',
        'knd_mesin',
        'knd_warna',
        'guna_desc',
        'wrn_desc',
        'ctk_notice_tanggal',
        'ctk_notice_seri',
        'knd_tgl_notice_new',
        'knd_tgl_notice_old',
        'knd_df_jenis',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ctk_notice_tanggal' => 'date:Y-m-d',
            'knd_tgl_notice_new' => 'date:Y-m-d',
            'knd_tgl_notice_old' => 'date:Y-m-d',
        ];
    }
}

