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
        Schema::table('pamerans', function (Blueprint $table) {
            $table->string('kabupaten', 100)->nullable()->after('tanggal_sewa_berakhir');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pamerans', function (Blueprint $table) {
            $table->dropColumn('kabupaten');
        });
    }
};
