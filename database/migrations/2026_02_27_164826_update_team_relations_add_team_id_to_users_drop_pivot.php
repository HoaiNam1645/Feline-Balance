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
        Schema::table('user_finances', function (Blueprint $table) {
            $table->unsignedBigInteger('team_finance_id')->nullable()->after('role_id');
        });

        Schema::dropIfExists('user_team_finances');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('user_team_finances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_finance_id');
            $table->unsignedBigInteger('team_finance_id');
            $table->timestamps();
        });

        Schema::table('user_finances', function (Blueprint $table) {
            $table->dropColumn('team_finance_id');
        });
    }
};
