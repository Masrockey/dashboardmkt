<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\JenisPameranController;
use App\Http\Controllers\PameranController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('dealers', DealerController::class)->except(['create', 'show', 'edit']);
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    Route::resource('jenis-pameran', JenisPameranController::class)->except(['create', 'show', 'edit']);
    Route::post('pameran/{pameran}/approve-spv', [PameranController::class, 'approveSpv'])->name('pameran.approve-spv');
    Route::post('pameran/{pameran}/approve-kabag', [PameranController::class, 'approveKabag'])->name('pameran.approve-kabag');
    Route::post('pameran/{pameran}/reject', [PameranController::class, 'reject'])->name('pameran.reject');
    Route::resource('pameran', PameranController::class)->except(['show', 'edit']);
    Route::get('api/geocode/search', [GeocodeController::class, 'search'])->name('geocode.search');
    Route::get('api/geocode/reverse', [GeocodeController::class, 'reverse'])->name('geocode.reverse');
});

require __DIR__.'/settings.php';
