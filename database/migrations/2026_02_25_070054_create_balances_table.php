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
        Schema::create('balances', function (Blueprint $table) {
            $table->string('profile_id', 24)->primary(); // ⭐ 1:1 with profiles, dùng luôn làm PK
            $table->decimal('net_earning', 12, 2)->default(0);
            $table->decimal('on_hold_amount', 12, 2)->default(0);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->timestamp('fetched_at')->useCurrent()->useCurrentOnUpdate();

            $table->foreign('profile_id')->references('id')->on('profiles')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('balances');
    }
};
