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
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeUploadController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\TikTokFinanceController;
use App\Http\Controllers\Api\TeamFinanceController;
use App\Http\Controllers\Api\StoreController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| Public Routes (no auth)
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/save-tiktok-data', [TikTokFinanceController::class, 'saveData']);
Route::get('/auth/me', [AuthController::class, 'me']);
/*
|--------------------------------------------------------------------------
| Protected Routes — admin + super_admin
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.auth'])->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Profiles
    Route::get('/profiles', [ProfileController::class, 'index']);
    Route::put('/profiles/{id}', [ProfileController::class, 'update']);
    Route::get('/profiles/{id}/logs', [ProfileController::class, 'logs']);
    Route::get('/profiles/{id}/2fa-code', [ProfileController::class, 'get2faCode']);
    Route::get('/profiles/{id}/2fa-logs', [ProfileController::class, 'profileTwoFaLogs']);
    Route::get('/2fa-logs', [ProfileController::class, 'twoFaLogs']);
    Route::post('/profiles/import-seller-csv', [ProfileController::class, 'importSellerCsv']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    // Design Statistics
    Route::get('/design-statistics', [App\Http\Controllers\Api\DesignStatisticsController::class, 'index']);
    Route::get('/fulfillment-statistics', [App\Http\Controllers\Api\FulfillmentStatisticsController::class, 'index']);

    // Media Transactions
    Route::get('/media-transactions', [MediaTransactionController::class, 'index']);
    Route::post('/media-transactions', [MediaTransactionController::class, 'store']);
    Route::post('/media-transactions/upload', [MediaTransactionController::class, 'uploadImage']);
    Route::post('/media-transactions/{id}', [MediaTransactionController::class, 'update']);
    Route::delete('/media-transactions/{id}', [MediaTransactionController::class, 'destroy']);

    // Upload (generic)
    Route::post('/upload', [UploadController::class, 'store']);

    // ── HRM Module ──
    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::post('/employees/upload-qr', [EmployeeUploadController::class, 'uploadQr']);
    Route::get('/employees/{id}', [EmployeeController::class, 'show']);
    Route::put('/employees/{id}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

    // Contracts (nested under employee)
    Route::get('/employees/{employeeId}/contracts', [ContractController::class, 'index']);
    Route::post('/employees/{employeeId}/contracts', [ContractController::class, 'store']);
    Route::put('/employees/{employeeId}/contracts/{contractId}', [ContractController::class, 'update']);
    Route::delete('/employees/{employeeId}/contracts/{contractId}', [ContractController::class, 'destroy']);

    // Payrolls
    Route::get('/payrolls', [PayrollController::class, 'index']);
    Route::post('/payrolls', [PayrollController::class, 'store']);
    Route::put('/payrolls/{id}', [PayrollController::class, 'update']);
    Route::delete('/payrolls/{id}', [PayrollController::class, 'destroy']);
    Route::post('/payrolls/generate', [PayrollController::class, 'generate']);

    // Stores
    Route::get('/stores', [StoreController::class, 'index']);
    Route::post('/stores', [StoreController::class, 'store']);
    Route::get('/stores/{id}', [StoreController::class, 'show']);
    Route::put('/stores/{id}', [StoreController::class, 'update']);
    Route::delete('/stores/{id}', [StoreController::class, 'destroy']);
    Route::get('/stores/{id}/payment-history', [StoreController::class, 'paymentHistory']);
    Route::post('/stores/import-csv', [StoreController::class, 'importCsv']);

    // Roles (Read-only for all authenticated users to populate dropdowns)
    Route::get('/roles', [RoleController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes — super_admin ONLY
|--------------------------------------------------------------------------
*/
Route::middleware(['jwt.auth', 'role.admin'])->group(function () {
    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Roles
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

    // Teams
    Route::get('/teams', [TeamController::class, 'index']);
    Route::post('/teams', [TeamController::class, 'store']);
    Route::put('/teams/{id}', [TeamController::class, 'update']);
    Route::delete('/teams/{id}', [TeamController::class, 'destroy']);

    // Team Finances
    Route::get('/team-finances', [TeamFinanceController::class, 'index']);
    Route::post('/team-finances', [TeamFinanceController::class, 'store']);
    Route::get('/team-finances/{id}', [TeamFinanceController::class, 'show']);
    Route::put('/team-finances/{id}', [TeamFinanceController::class, 'update']);
    Route::delete('/team-finances/{id}', [TeamFinanceController::class, 'destroy']);
    Route::post('/team-finances/{id}/members', [TeamFinanceController::class, 'assignMembers']);
    Route::delete('/team-finances/{id}/members/{userId}', [TeamFinanceController::class, 'removeMember']);

    // Vendors
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::put('/vendors/{id}', [VendorController::class, 'update']);
    Route::delete('/vendors/{id}', [VendorController::class, 'destroy']);
});
