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
        Schema::create('monthly_settlements', function (Blueprint $table) {
            $table->id();
            $table->string('profile_id', 24);
            $table->char('month', 7); // ⭐ Lưu "2025-01" thay vì DATE
            $table->decimal('settlement', 12, 2)->default(0);
            $table->timestamp('fetched_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['profile_id', 'month'], 'uq_profile_month');
            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('monthly_settlements');
    }
};
