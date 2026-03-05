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
        if (Schema::hasColumn('media_transactions', 'company_id')) {
            Schema::table('media_transactions', function (Blueprint $table) {
                // Drop foreign key if exists, using typical naming or explicitly
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            });
        }

        if (!Schema::hasColumn('media_transactions', 'team_id')) {
            Schema::table('media_transactions', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained('teams')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('media_transactions', 'team_id')) {
            Schema::table('media_transactions', function (Blueprint $table) {
                $table->dropForeign(['team_id']);
                $table->dropColumn('team_id');
            });
        }

        if (!Schema::hasColumn('media_transactions', 'company_id')) {
            Schema::table('media_transactions', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->nullOnDelete();
            });
        }
    }
};
