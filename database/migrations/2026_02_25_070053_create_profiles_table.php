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
        Schema::create('profiles', function (Blueprint $table) {
            $table->string('id', 24)->primary(); // HidemyAcc profile ID
            $table->string('profile_name', 255)->nullable();
            $table->string('profile_code', 100)->nullable();
            $table->string('seller_id', 30)->nullable(); // TikTok seller_id
            $table->string('team', 100)->nullable();
            $table->string('status', 50)->nullable();
            $table->char('bank_last4', 4)->nullable();
            $table->string('beneficiary_name', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->index('seller_id', 'idx_seller_id');
            $table->index('team', 'idx_team');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
