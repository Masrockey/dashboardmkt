<?php

use App\Http\Controllers\BillboardController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealerController;
use App\Http\Controllers\FormBuilderController;
use App\Http\Controllers\GeocodeController;
use App\Http\Controllers\JenisPameranController;
use App\Http\Controllers\KabupatenController;
use App\Http\Controllers\MarketingDashboardController;
use App\Http\Controllers\MeetAndGreetController;
use App\Http\Controllers\PameranController;
use App\Http\Controllers\PublicFormController;
use App\Http\Controllers\PublicMeetAndGreetController;
use App\Http\Controllers\R2Controller;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SegmentController;
use App\Http\Controllers\SeriesController;
use App\Http\Controllers\TypeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WaServerController;
use App\Http\Middleware\EnsureMarketingAccess;
use App\Http\Middleware\EnsureMasterDataAccess;
use Illuminate\Support\Facades\Route;

Route::redirect('/', 'login')->name('home');

// Public Form Shareable Links
Route::get('/f/{slug}', [PublicFormController::class, 'show'])->name('forms.public.show');
Route::post('/f/{slug}', [PublicFormController::class, 'submit'])->name('forms.public.submit');

Route::get('/meetngreethonda', [PublicMeetAndGreetController::class, 'index'])->name('meetngreethonda.index');
Route::post('/meetngreethonda', [PublicMeetAndGreetController::class, 'store'])->name('meetngreethonda.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::resource('dealers', DealerController::class)->except(['create', 'show', 'edit']);
    Route::resource('users', UserController::class)->except(['create', 'show', 'edit']);
    Route::resource('roles', RoleController::class)->except(['create', 'show', 'edit']);

    // Marketing (Hanya untuk Superadmin, SPV, & Kabag)
    Route::middleware(EnsureMarketingAccess::class)->group(function () {
        Route::get('marketing/dashboard', [MarketingDashboardController::class, 'index'])->name('marketing.dashboard');
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
        Route::get('types/export', [TypeController::class, 'export'])->name('types.export');
        Route::get('types/template', [TypeController::class, 'template'])->name('types.template');
        Route::post('types/import', [TypeController::class, 'import'])->name('types.import');
        Route::resource('types', TypeController::class)->except(['create', 'show', 'edit']);
        Route::resource('series', SeriesController::class)->except(['create', 'show', 'edit']);
    });
    Route::get('pameran/export', [PameranController::class, 'export'])->name('pameran.export');
    Route::get('pameran/template', [PameranController::class, 'template'])->name('pameran.template');
    Route::post('pameran/import', [PameranController::class, 'import'])->name('pameran.import');
    Route::post('pameran/{pameran}/approve-spv', [PameranController::class, 'approveSpv'])->name('pameran.approve-spv');
    Route::post('pameran/{pameran}/approve-kabag', [PameranController::class, 'approveKabag'])->name('pameran.approve-kabag');
    Route::post('pameran/{pameran}/reject', [PameranController::class, 'reject'])->name('pameran.reject');
    Route::resource('pameran', PameranController::class)->except(['show', 'edit']);
    Route::get('meet-and-greet/export', [MeetAndGreetController::class, 'export'])->name('meet-and-greet.export');
    Route::post('meet-and-greet/toggle-status', [MeetAndGreetController::class, 'toggleStatus'])->name('meet-and-greet.toggle-status');
    Route::resource('meet-and-greet', MeetAndGreetController::class)->except(['create', 'show', 'edit']);

    // Form Builder
    Route::get('forms', [FormBuilderController::class, 'index'])->name('forms.index');
    Route::get('forms/create', [FormBuilderController::class, 'create'])->name('forms.create');
    Route::post('forms', [FormBuilderController::class, 'store'])->name('forms.store');
    Route::get('forms/{form}/edit', [FormBuilderController::class, 'edit'])->name('forms.edit');
    Route::put('forms/{form}', [FormBuilderController::class, 'update'])->name('forms.update');
    Route::delete('forms/{form}', [FormBuilderController::class, 'destroy'])->name('forms.destroy');
    Route::get('forms/{form}/responses', [FormBuilderController::class, 'responses'])->name('forms.responses');
    Route::post('forms/{form}/toggle-status', [FormBuilderController::class, 'toggleStatus'])->name('forms.toggle-status');
    Route::get('forms/{form}/export', [FormBuilderController::class, 'export'])->name('forms.export');

    // Promosi - ATL
    Route::resource('billboards', BillboardController::class)->except(['create', 'show', 'edit']);
    Route::get('api/geocode/search', [GeocodeController::class, 'search'])->name('geocode.search');
    Route::get('api/geocode/reverse', [GeocodeController::class, 'reverse'])->name('geocode.reverse');

    // WA Server Integration
    Route::get('wa-server', [WaServerController::class, 'index'])->name('wa-server.index');
    Route::post('wa-server/settings', [WaServerController::class, 'updateSettings'])->name('wa-server.settings');
    Route::get('wa-server/qr', [WaServerController::class, 'getQr'])->name('wa-server.qr');
    Route::post('wa-server/pair-code', [WaServerController::class, 'getPairingCode'])->name('wa-server.pair-code');
    Route::get('wa-server/status', [WaServerController::class, 'checkStatus'])->name('wa-server.status');
    Route::post('wa-server/reconnect', [WaServerController::class, 'reconnect'])->name('wa-server.reconnect');
    Route::post('wa-server/logout', [WaServerController::class, 'logout'])->name('wa-server.logout');
    Route::post('wa-server/devices', [WaServerController::class, 'addDevice'])->name('wa-server.devices.store');
    Route::delete('wa-server/devices/{deviceId}', [WaServerController::class, 'deleteDevice'])->name('wa-server.devices.destroy');
    Route::get('wa-server/groups', [WaServerController::class, 'getGroups'])->name('wa-server.groups');
    Route::post('wa-server/target-group', [WaServerController::class, 'setTargetGroup'])->name('wa-server.target-group');
    Route::post('wa-server/test-message', [WaServerController::class, 'sendTestMessage'])->name('wa-server.test-message');
});

require __DIR__.'/settings.php';
