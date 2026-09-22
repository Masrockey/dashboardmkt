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
            $table->string('kode_pameran_md', 50)->nullable()->change();
            $table->string('status', 30)->default('menunggu_spv')->after('kode_pameran_ahm');
            $table->foreignId('created_by_user_id')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->foreignId('spv_approved_by')->nullable()->after('created_by_user_id')->constrained('users')->nullOnDelete();
            $table->timestamp('spv_approved_at')->nullable()->after('spv_approved_by');
            $table->foreignId('kabag_approved_by')->nullable()->after('spv_approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('kabag_approved_at')->nullable()->after('kabag_approved_by');
            $table->text('catatan_penolakan')->nullable()->after('kabag_approved_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pamerans', function (Blueprint $table) {
            $table->dropForeign(['created_by_user_id']);
            $table->dropForeign(['spv_approved_by']);
            $table->dropForeign(['kabag_approved_by']);
            $table->dropColumn([
                'status',
                'created_by_user_id',
                'spv_approved_by',
                'spv_approved_at',
                'kabag_approved_by',
                'kabag_approved_at',
                'catatan_penolakan',
            ]);
            $table->string('kode_pameran_md', 50)->nullable(false)->change();
        });
    }
};
