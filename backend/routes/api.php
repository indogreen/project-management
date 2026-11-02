<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BarangCertificateController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\MitraController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::group(['middleware' => 'api', 'prefix' => 'auth'], function ($router) {
    Route::post('/register', [AuthController::class, 'register'])->middleware('sliding_throttle:5,60,auth')->name('register');
    Route::post('/login', [AuthController::class, 'login'])->middleware('sliding_throttle:5,60,auth')->name('login');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api')->name('logout');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth:api')->name('refresh');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:api')->name('me');
    Route::put('/profile', [AuthController::class, 'updateProfile'])->middleware('auth:api')->name('profile.update');
    Route::put('/password', [AuthController::class, 'changePassword'])->middleware('auth:api')->name('password.update');

    // Daftar user untuk dikelola (super_admin & admin)
    Route::get('/role/users', [RoleController::class, 'users'])
        ->middleware(['auth:api', 'role:super_admin|admin'])
        ->name('role.users');

    // Update role & job user lain (super_admin & admin)
    Route::put('/role', [RoleController::class, 'update'])
        ->middleware(['auth:api', 'role:super_admin|admin'])
        ->name('role.update');

    // Config role & permission (modul & label) (super_admin & admin)
    Route::get('/role/config', [RoleController::class, 'config'])
        ->middleware(['auth:api', 'role:super_admin|admin'])
        ->name('role.config');
});

Route::group(['middleware' => ['auth:api', 'sliding_throttle:15,60,api']], function () {

    // Project
    Route::apiResource('projects', ProjectController::class);

    // Mitra/Partner
    Route::apiResource('mitras', MitraController::class);

    // Activity
    Route::apiResource('activities', ActivityController::class);

    // Barang Certificate
    Route::apiResource('barang-certificates', BarangCertificateController::class);

    // Certificate
    Route::apiResource('certificates', CertificateController::class);

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Finance Report
    Route::apiResource('finance', FinanceController::class)->only(['index', 'update']);

    // Category & Warehouse
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('warehouses', WarehouseController::class);
    Route::apiResource('items', ItemController::class);

    // Stock Movement Ledger
    Route::post('stock-movements/inbound', [StockMovementController::class, 'inbound']);
    Route::post('stock-movements/outbound', [StockMovementController::class, 'outbound']);
    Route::post('stock-movements/transfer', [StockMovementController::class, 'transfer']);
    Route::post('stock-movements/allocate-project', [StockMovementController::class, 'allocateProject']);
    Route::apiResource('stock-movements', StockMovementController::class)->only(['index', 'show']);

    // Activity Logs
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('activity-logs/recent', [ActivityLogController::class, 'getRecent']);
    Route::get('activity-logs/stats', [ActivityLogController::class, 'getStats']);
    Route::get('activity-logs/filter-options', [ActivityLogController::class, 'getFilterOptions']);
    Route::get('activity-logs/{modelType}/{modelId}', [ActivityLogController::class, 'getModelLogs']);
    Route::get('activity-logs/export', [ActivityLogController::class, 'export']);
    Route::delete('activity-logs', [ActivityLogController::class, 'deleteUserLogs']);
});
