<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->unsignedBigInteger('feline_id')->nullable()->after('id')->index();
            $table->string('code')->nullable()->after('name');
            $table->unsignedBigInteger('manager_id')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['feline_id', 'code', 'manager_id']);
        });
    }
};
