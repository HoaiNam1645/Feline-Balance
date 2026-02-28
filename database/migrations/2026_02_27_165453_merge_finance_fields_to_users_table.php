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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->unsignedBigInteger('team_finance_id')->nullable()->after('role_id');
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->renameColumn('user_finance_id', 'user_id');
        });

        Schema::dropIfExists('user_finances');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'team_finance_id']);
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->renameColumn('user_id', 'user_finance_id');
        });

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
};
