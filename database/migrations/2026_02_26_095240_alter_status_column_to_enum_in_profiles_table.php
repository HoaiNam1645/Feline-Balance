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
        // Convert existing status to new enum values before altering the column
        \Illuminate\Support\Facades\DB::statement("UPDATE `profiles` SET `status` = 'active' WHERE LOWER(`status`) IN ('active', 'connected') OR `status` IS NULL");
        \Illuminate\Support\Facades\DB::statement("UPDATE `profiles` SET `status` = 'die' WHERE `status` != 'active'");

        \Illuminate\Support\Facades\DB::statement("ALTER TABLE `profiles` MODIFY COLUMN `status` ENUM('active', 'die') NOT NULL DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE `profiles` MODIFY COLUMN `status` VARCHAR(50) DEFAULT NULL");
    }
};
