<?php

use Illuminate\Support\Facades\Route;

Route::get('/profiles', [\App\Http\Controllers\Api\ProfileController::class, 'index']);
Route::put('/profiles/{id}', [\App\Http\Controllers\Api\ProfileController::class, 'update']);

Route::get('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'index']);
Route::post('/transactions', [\App\Http\Controllers\Api\TransactionController::class, 'store']);
Route::put('/transactions/{id}', [\App\Http\Controllers\Api\TransactionController::class, 'update']);
Route::delete('/transactions/{id}', [\App\Http\Controllers\Api\TransactionController::class, 'destroy']);
