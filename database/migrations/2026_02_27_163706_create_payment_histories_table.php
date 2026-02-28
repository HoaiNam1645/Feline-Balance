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
        Schema::create('payment_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('store_id')->nullable();

            // Map from CSV columns
            $table->dateTime('transaction_date')->nullable(); // Time
            $table->string('currency', 10)->nullable(); // Currency
            $table->decimal('amount', 15, 2)->nullable(); // Amount
            $table->string('transaction_id')->nullable()->index(); // TransactionId
            $table->string('account_no')->nullable(); // Account No.
            $table->decimal('fee', 15, 2)->nullable(); // Fee
            $table->decimal('rate', 15, 5)->nullable(); // Rate
            $table->decimal('net', 15, 2)->nullable(); // Net
            $table->string('type')->nullable(); // Type
            $table->string('from_to')->nullable(); // From/To
            $table->string('status')->nullable(); // Status
            $table->text('description')->nullable(); // Note/Description

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_histories');
    }
};
