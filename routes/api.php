<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\DesignStatisticsController;
use App\Http\Controllers\Api\MediaTransactionController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| Public Routes (no auth)
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes — admin + super_admin
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.auth', 'role.admin'])->group(function () {
    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Profiles
    Route::get('/profiles', [ProfileController::class, 'index']);
    Route::put('/profiles/{id}', [ProfileController::class, 'update']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    // Design Statistics
    Route::get('/design-statistics', [DesignStatisticsController::class, 'index']);

    // Media Transactions
    Route::get('/media-transactions', [MediaTransactionController::class, 'index']);
    Route::post('/media-transactions', [MediaTransactionController::class, 'store']);
    Route::post('/media-transactions/upload', [MediaTransactionController::class, 'uploadImage']);
    Route::post('/media-transactions/{id}', [MediaTransactionController::class, 'update']);
    Route::delete('/media-transactions/{id}', [MediaTransactionController::class, 'destroy']);

    // Upload (generic)
    Route::post('/upload', [UploadController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes — super_admin ONLY
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.auth', 'role.super_admin'])->group(function () {
    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Teams
    Route::get('/teams', [TeamController::class, 'index']);
    Route::post('/teams', [TeamController::class, 'store']);
    Route::put('/teams/{id}', [TeamController::class, 'update']);
    Route::delete('/teams/{id}', [TeamController::class, 'destroy']);

    // Vendors
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::put('/vendors/{id}', [VendorController::class, 'update']);
    Route::delete('/vendors/{id}', [VendorController::class, 'destroy']);
});
