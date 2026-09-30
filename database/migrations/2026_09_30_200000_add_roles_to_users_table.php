<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('roles')->nullable()->after('email');
        });

        // Copy data from single role to roles JSON array
        DB::table('users')->whereNotNull('role')->get()->each(function ($user) {
            if ($user->role) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['roles' => json_encode([$user->role])]);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('roles');
        });
    }
};
