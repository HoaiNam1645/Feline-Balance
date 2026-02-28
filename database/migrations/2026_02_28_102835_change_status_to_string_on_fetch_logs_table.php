<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change enum to varchar using raw SQL because doctrine/dbal doesn't support changing ENUM columns easily
        DB::statement('ALTER TABLE fetch_logs MODIFY status VARCHAR(50);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Just reverting it back to a generic varchar instead of strict enum to avoid data loss
        DB::statement('ALTER TABLE fetch_logs MODIFY status VARCHAR(50);');
    }
};
