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
            $table->string('username', 50)->nullable()->unique()->after('name');
        });

        // Isi username bagi user yang sudah ada
        $users = DB::table('users')->get();
        foreach ($users as $user) {
            $username = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '', $user->name));
            if (empty($username)) {
                $username = explode('@', $user->email)[0];
            }

            // Pastikan unik
            $baseUsername = $username;
            $counter = 1;
            while (DB::table('users')->where('username', $username)->where('id', '!=', $user->id)->exists()) {
                $username = $baseUsername.$counter;
                $counter++;
            }

            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('username');
        });
    }
};
