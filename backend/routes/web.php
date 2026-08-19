<?php

use App\Http\Controllers\AffiliationApplicationController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('guest')
    ->name('login');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::prefix('affiliation-applications')->group(function (): void {
    Route::post('/', [AffiliationApplicationController::class, 'store'])
        ->name('affiliation-applications.store');
    Route::post('/{application}/sections/{section}', [AffiliationApplicationController::class, 'storeSection'])
        ->name('affiliation-applications.sections.store');
    Route::post('/{application}/documents', [AffiliationApplicationController::class, 'storeDocument'])
        ->name('affiliation-applications.documents.store');
    Route::post('/{application}/consents', [AffiliationApplicationController::class, 'storeConsent'])
        ->name('affiliation-applications.consents.store');
    Route::post('/{application}/submit', [AffiliationApplicationController::class, 'submit'])
        ->name('affiliation-applications.submit');
});

Route::middleware('auth')
    ->prefix('admin/affiliation-applications')
    ->name('admin.affiliation-applications.')
    ->group(function (): void {
        Route::post('/{application}/review', [AffiliationApplicationController::class, 'startReview'])
            ->middleware('can:startReview,application')
            ->name('review');
        Route::post('/{application}/correction', [AffiliationApplicationController::class, 'requestCorrection'])
            ->middleware('can:requestCorrection,application')
            ->name('correction');
        Route::post('/{application}/approve', [AffiliationApplicationController::class, 'approve'])
            ->middleware('can:approve,application')
            ->name('approve');
        Route::post('/{application}/reject', [AffiliationApplicationController::class, 'reject'])
            ->middleware('can:reject,application')
            ->name('reject');
    });
