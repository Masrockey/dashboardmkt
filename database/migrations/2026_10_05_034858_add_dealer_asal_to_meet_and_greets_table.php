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
        Schema::table('meet_and_greets', function (Blueprint $table) {
            $table->string('dealer_asal', 100)->nullable()->after('no_registrasi');
            $table->foreignId('dealer_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('meet_and_greets', function (Blueprint $table) {
            $table->dropColumn('dealer_asal');
            $table->foreignId('dealer_id')->nullable(false)->change();
        });
    }
};
