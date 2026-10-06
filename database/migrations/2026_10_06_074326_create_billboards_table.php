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
        Schema::create('billboards', function (Blueprint $table) {
            $table->id();
            $table->string('lokasi');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('ukuran', 100);
            $table->date('tanggal_pasang');
            $table->date('tanggal_berakhir')->nullable();
            $table->string('status_lampu', 30);
            $table->string('status_fisik', 30);
            $table->string('foto_siang')->nullable();
            $table->string('foto_malam')->nullable();
            $table->string('foto_jarak_jauh')->nullable();
            $table->string('foto_jarak_dekat')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billboards');
    }
};
