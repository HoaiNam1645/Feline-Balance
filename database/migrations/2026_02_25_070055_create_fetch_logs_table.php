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
        Schema::create('fetch_logs', function (Blueprint $table) {
            $table->id();
            $table->string('profile_id', 24)->nullable();
            $table->enum('status', ['success', 'failed', 'timeout', 'not_logged_in']);
            $table->text('error_message')->nullable();
            $table->integer('duration_ms')->nullable(); // Thời gian fetch (ms)
            $table->timestamp('fetched_at')->useCurrent();

            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('cascade');
            $table->index(['profile_id', 'status'], 'idx_profile_status');
            $table->index('fetched_at', 'idx_fetched_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fetch_logs');
    }
};
