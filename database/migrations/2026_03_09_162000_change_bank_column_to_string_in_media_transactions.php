<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the enum column and recreate as varchar to allow free-text bank names
        DB::statement("ALTER TABLE `media_transactions` MODIFY `bank` VARCHAR(255) NOT NULL DEFAULT ''");
    }

    public function down(): void
    {
        // Revert to original enum (data outside enum will be lost)
        DB::statement("ALTER TABLE `media_transactions` MODIFY `bank` ENUM('Vietcombank','Techcombank','Sacombank') NOT NULL");
    }
};
