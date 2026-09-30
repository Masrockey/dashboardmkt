<?php

use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\JenisPameranController;
use App\Http\Controllers\KabupatenController;
use App\Http\Controllers\PameranController;
use App\Http\Controllers\R2Controller;
use App\Http\Controllers\SegmentController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

use App\Http\Middleware\EnsureMarketingAccess;
use App\Http\Middleware\EnsureMasterDataAccess;

Route::redirect('/', 'login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('dealers', DealerController::class)->except(['create', 'show', 'edit']);
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);

    // Marketing (Hanya untuk Superadmin, SPV, & Kabag)
    Route::middleware(EnsureMarketingAccess::class)->group(function () {
        Route::post('r2/import', [R2Controller::class, 'import'])->name('r2.import');
        Route::resource('r2', R2Controller::class)->except(['create', 'show', 'edit']);
    });

    // Master Data (Hanya untuk Superadmin & SPV)

    Route::middleware(EnsureMasterDataAccess::class)->group(function () {
        Route::resource('jenis-pameran', JenisPameranController::class)->except(['create', 'show', 'edit']);
        Route::resource('segments', SegmentController::class)->except(['create', 'show', 'edit']);
        Route::resource('brands', BrandController::class)->except(['create', 'show', 'edit']);
        Route::resource('categories', CategoryController::class)->except(['create', 'show', 'edit']);
        Route::resource('kabupatens', KabupatenController::class)->except(['create', 'show', 'edit']);
        Route::resource('types', TypeController::class)->except(['create', 'show', 'edit']);
    });
    Route::post('pameran/{pameran}/approve-spv', [PameranController::class, 'approveSpv'])->name('pameran.approve-spv');
    Route::post('pameran/{pameran}/approve-kabag', [PameranController::class, 'approveKabag'])->name('pameran.approve-kabag');
    Route::post('pameran/{pameran}/reject', [PameranController::class, 'reject'])->name('pameran.reject');
    Route::resource('pameran', PameranController::class)->except(['show', 'edit']);
    Route::get('api/geocode/search', [GeocodeController::class, 'search'])->name('geocode.search');
    Route::get('api/geocode/reverse', [GeocodeController::class, 'reverse'])->name('geocode.reverse');
});

require __DIR__.'/settings.php';
