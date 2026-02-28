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
        Schema::create('user_team_finances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_finance_id');
            $table->unsignedBigInteger('team_finance_id');
            $table->timestamps();

            // Optional: Foreign keys constraint if necessary later
            // $table->foreign('user_finance_id')->references('id')->on('user_finances')->onDelete('cascade');
            // $table->foreign('team_finance_id')->references('id')->on('team_finances')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_team_finances');
    }
};
