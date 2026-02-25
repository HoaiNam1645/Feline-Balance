<?php

use Illuminate\Support\Facades\Route;

Route::get('/profiles', [\App\Http\Controllers\Api\ProfileController::class, 'index']);
Route::put('/profiles/{id}', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
