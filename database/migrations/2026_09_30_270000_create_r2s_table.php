<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('r2s', function (Blueprint $table) {
            $table->id();
            $table->string('drv_desc')->nullable();
            $table->string('knd_nopol')->nullable();
            $table->string('knd_nama')->nullable();
            $table->text('knd_alamat')->nullable();
            $table->string('kel_desc')->nullable();
            $table->string('kec_desc')->nullable();
            $table->string('kab_desc')->nullable();
            $table->string('jns_desc')->nullable();
            $table->string('mrk_desc')->nullable();
            $table->string('pkb_desc')->nullable();
            $table->string('knd_thn_buat')->nullable();
            $table->string('knd_cyl')->nullable();
            $table->string('knd_rangka')->nullable();
            $table->string('knd_mesin')->nullable();
            $table->string('knd_warna')->nullable();
            $table->string('guna_desc')->nullable();
            $table->string('wrn_desc')->nullable();
            $table->date('ctk_notice_tanggal')->nullable();
            $table->string('ctk_notice_seri')->nullable();
            $table->date('knd_tgl_notice_new')->nullable();
            $table->date('knd_tgl_notice_old')->nullable();
            $table->string('knd_df_jenis')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('r2s');
    }
};
