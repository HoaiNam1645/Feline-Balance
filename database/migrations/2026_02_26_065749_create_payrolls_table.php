<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->decimal('work_days', 4, 1)->default(0);
            $table->decimal('paid_leave_days', 4, 1)->default(0);
            $table->decimal('unpaid_leave_days', 4, 1)->default(0);
            $table->decimal('insurance_deduction', 15, 0)->default(0);
            $table->decimal('bonus', 15, 0)->default(0);
            $table->decimal('penalty', 15, 0)->default(0);
            $table->decimal('net_salary', 15, 0)->default(0);
            $table->enum('payment_status', ['pending', 'completed'])->default('pending');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'month', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
