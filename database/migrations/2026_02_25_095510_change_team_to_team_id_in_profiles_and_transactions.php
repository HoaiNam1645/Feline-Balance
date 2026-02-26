<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // --- Profiles: team (string) -> team_id (foreign key) ---
        Schema::table('profiles', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->after('seller_id');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('set null');
        });

        // Migrate existing team names to team_id
        DB::statement('UPDATE profiles p INNER JOIN teams t ON p.team = t.name SET p.team_id = t.id');

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('team');
        });

        // --- Transactions: team (string) -> team_id (foreign key) ---
        Schema::table('transactions', function (Blueprint $table) {
            $table->unsignedBigInteger('team_id')->nullable()->after('type');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('set null');
        });

        // Migrate existing team names to team_id
        DB::statement('UPDATE transactions tr INNER JOIN teams t ON tr.team = t.name SET tr.team_id = t.id');

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('team');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('team')->nullable()->after('seller_id');
        });

        DB::statement('UPDATE profiles p INNER JOIN teams t ON p.team_id = t.id SET p.team = t.name');

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn('team_id');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('team')->nullable()->after('type');
        });

        DB::statement('UPDATE transactions tr INNER JOIN teams t ON tr.team_id = t.id SET tr.team = t.name');

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['team_id']);
            $table->dropColumn('team_id');
        });
    }
};
