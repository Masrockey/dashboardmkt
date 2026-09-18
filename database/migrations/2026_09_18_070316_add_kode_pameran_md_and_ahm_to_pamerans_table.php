<?php

use App\Models\Pameran;
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
            $table->string('kode_pameran_md', 50)->nullable()->after('id');
            $table->string('kode_pameran_ahm', 50)->nullable()->after('kode_pameran_md');
        });

        // Backfill any existing records
        $existing = Pameran::whereNull('kode_pameran_md')->get();
        foreach ($existing as $index => $item) {
            $item->kode_pameran_md = sprintf('MD-%s-%04d', now()->format('Ym'), $index + 1);
            $item->save();
        }

        Schema::table('pamerans', function (Blueprint $table) {
            $table->string('kode_pameran_md', 50)->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pamerans', function (Blueprint $table) {
            $table->dropColumn(['kode_pameran_md', 'kode_pameran_ahm']);
        });
    }
};
