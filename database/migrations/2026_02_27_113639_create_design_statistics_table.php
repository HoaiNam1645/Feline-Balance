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
        Schema::create('design_statistics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('external_user_id')->index();
            $table->string('user_name');
            $table->string('user_avatar')->nullable();
            $table->string('team_name')->nullable()->index();
            $table->string('role_name')->nullable();
            $table->smallInteger('year')->index();
            $table->tinyInteger('month')->index();
            $table->integer('print_count')->default(0);
            $table->integer('embroidery_count')->default(0);
            $table->integer('sticker_count')->default(0);
            $table->integer('designs_count')->default(0);
            $table->timestamps();

            // Unique constraint to prevent duplicates during UPSERT
            $table->unique(['external_user_id', 'year', 'month'], 'design_stat_unique_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('design_statistics');
    }
};
