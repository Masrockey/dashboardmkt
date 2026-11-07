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
            $table->text('catatan_approval')->nullable()->after('catatan_penolakan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pamerans', function (Blueprint $table) {
            $table->dropColumn('catatan_approval');
        });
    }
};
