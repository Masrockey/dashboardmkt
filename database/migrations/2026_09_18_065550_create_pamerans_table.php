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
        Schema::create('pamerans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dealer_id')->constrained('dealers')->cascadeOnDelete();
            $table->foreignId('jenis_pameran_id')->constrained('jenis_pamerans')->cascadeOnDelete();
            $table->date('mulai_tanggal_sewa');
            $table->date('tanggal_sewa_berakhir');
            $table->string('kecamatan', 100);
            $table->text('detail_alamat');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pamerans');
    }
};
