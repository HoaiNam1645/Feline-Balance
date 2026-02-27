<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('design_statistics', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->after('user_avatar')->index();
        });

        Schema::table('fulfillment_statistics', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->after('avatar')->index();
        });
    }

    public function down(): void
    {
        Schema::table('design_statistics', function (Blueprint $table) {
            $table->dropColumn('team_id');
        });

        Schema::table('fulfillment_statistics', function (Blueprint $table) {
            $table->dropColumn('team_id');
        });
    }
};
