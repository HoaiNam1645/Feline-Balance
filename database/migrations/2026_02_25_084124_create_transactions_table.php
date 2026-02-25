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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->nullable()->index();
            $table->string('type')->default('request'); // request, topup, thu, chi, v.v.
            $table->string('payment_method'); // Pingpong, Paypal, Vietcombank, v.v.
            $table->decimal('amount', 15, 2);
            $table->text('image')->nullable();
            $table->string('status')->default('pending'); // pending, completed, rejected
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
