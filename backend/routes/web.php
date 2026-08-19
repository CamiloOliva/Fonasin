<?php

use App\Http\Controllers\AffiliationApplicationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

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
