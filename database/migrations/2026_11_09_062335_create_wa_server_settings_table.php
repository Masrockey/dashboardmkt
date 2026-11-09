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
        Schema::create('wa_server_settings', function (Blueprint $table) {
            $table->id();
            $table->string('server_url')->default('https://waserver.geofani.biz.id');
            $table->string('device_id')->default('rentcars_main');
            $table->string('auth_username')->nullable()->default('admin');
            $table->string('auth_password')->nullable()->default('Jomblo123@');
            $table->string('webhook_url')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->boolean('auto_reconnect')->default(true);
            $table->string('target_group_jid')->nullable()->default('120363432126043755@g.us');
            $table->string('target_group_name')->nullable()->default('Test grup');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wa_server_settings');
    }
};
