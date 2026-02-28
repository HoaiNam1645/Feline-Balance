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
        Schema::create('user_finances', function (Blueprint $table) {
            $table->id();
            $table->string('user_name')->nullable();
            $table->string('full_name')->nullable();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->unsignedBigInteger('role_id')->nullable();
            $table->string('status')->nullable();
            $table->string('password');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_finances');
    }
};
