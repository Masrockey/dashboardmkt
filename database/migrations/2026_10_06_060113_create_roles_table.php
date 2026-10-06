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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->text('description')->nullable();
            $table->json('permissions')->nullable();
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Seed initial default roles
        DB::table('roles')->insert([
            [
                'name' => 'superadmin',
                'label' => 'Superadmin',
                'description' => 'Administrator utama dengan akses penuh ke seluruh sistem.',
                'permissions' => json_encode(['*']),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'spv',
                'label' => 'SPV',
                'description' => 'Supervisor dengan akses approval channel, master data, dan marketing.',
                'permissions' => json_encode([
                    'pcd.dashboard',
                    'pcd.channel',
                    'pcd.channel_approval_spv',
                    'pcd.jenis_channel',
                    'pcd.meet_and_greet',
                    'marketing.dashboard',
                    'marketing.r2',
                    'master_data.access',
                    'management.dealers',
                    'management.users',
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'kabag',
                'label' => 'Kabag',
                'description' => 'Kepala Bagian dengan akses approval channel kabag dan marketing.',
                'permissions' => json_encode([
                    'pcd.dashboard',
                    'pcd.channel',
                    'pcd.channel_approval_kabag',
                    'pcd.meet_and_greet',
                    'marketing.dashboard',
                    'marketing.r2',
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'dealer',
                'label' => 'Dealer',
                'description' => 'Akun dealer dengan akses terbatas ke channel pameran dealer dan meet & greet.',
                'permissions' => json_encode([
                    'pcd.dashboard',
                    'pcd.channel',
                    'pcd.meet_and_greet',
                ]),
                'is_system' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
