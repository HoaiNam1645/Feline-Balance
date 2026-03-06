<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE media_transactions MODIFY COLUMN status ENUM('pending', 'complete', 'rejected') DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE media_transactions MODIFY COLUMN status ENUM('pending', 'complete') DEFAULT 'pending'");
    }
};
