<?php

use App\Http\Controllers\DealerController;
use App\Http\Controllers\JenisPameranController;
use App\Http\Controllers\PameranController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::resource('dealers', DealerController::class)->except(['create', 'show', 'edit']);
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    Route::resource('jenis-pameran', JenisPameranController::class)->except(['create', 'show', 'edit']);
    Route::resource('pameran', PameranController::class)->except(['create', 'show', 'edit']);
});

require __DIR__.'/settings.php';
