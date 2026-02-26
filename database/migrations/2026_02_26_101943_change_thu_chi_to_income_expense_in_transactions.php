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
        \Illuminate\Support\Facades\DB::statement("UPDATE `transactions` SET `type` = 'income' WHERE `type` = 'thu'");
        \Illuminate\Support\Facades\DB::statement("UPDATE `transactions` SET `type` = 'expense' WHERE `type` = 'chi'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement("UPDATE `transactions` SET `type` = 'thu' WHERE `type` = 'income'");
        \Illuminate\Support\Facades\DB::statement("UPDATE `transactions` SET `type` = 'chi' WHERE `type` = 'expense'");
    }
};
