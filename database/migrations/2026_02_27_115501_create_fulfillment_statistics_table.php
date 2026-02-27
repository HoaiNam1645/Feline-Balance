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
        Schema::create('fulfillment_statistics', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20)->index(); // 'user' or 'store'
            $table->unsignedBigInteger('external_id')->index();
            $table->string('name')->nullable();
            $table->string('avatar')->nullable();
            $table->string('team_name')->nullable()->index();
            $table->string('role_name')->nullable();
            $table->string('account_code')->nullable();
            $table->string('status_name')->nullable();
            // Default 0 implies it's the "Total/All Units" statistic, preventing the MySQL multiple-NULLs unique trap.
            $table->unsignedBigInteger('fulfill_unit_id')->default(0)->index();
            $table->smallInteger('year')->index();
            $table->tinyInteger('month')->index();
            $table->integer('order_count')->default(0);
            $table->decimal('total_price', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['type', 'external_id', 'year', 'month', 'fulfill_unit_id'], 'fulfill_stat_unique_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fulfillment_statistics');
    }
};
