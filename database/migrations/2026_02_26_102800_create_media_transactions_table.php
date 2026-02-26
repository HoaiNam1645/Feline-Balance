<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('image')->nullable()->comment('B2 image URL');
            $table->string('transaction_code')->nullable();
            $table->enum('bank', ['Vietcombank', 'Techcombank', 'Sacombank']);
            $table->timestamp('transaction_date')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->enum('status', ['pending', 'complete'])->default('pending');
            $table->timestamps();
            $table->softDeletes();

            $table->index('team_id');
            $table->index('bank');
            $table->index('status');
            $table->index('transaction_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_transactions');
    }
};
