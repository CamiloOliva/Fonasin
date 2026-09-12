<?php

use App\Http\Controllers\AffiliationApplicationController;
use App\Http\Controllers\AssociateController;
use App\Http\Controllers\AssociateProfileController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\CreditAccountController;
use App\Http\Controllers\FpqrsSubmissionController;
use App\Http\Controllers\ImportBatchController;
use App\Http\Controllers\PortalAccountStatementController;
use App\Http\Controllers\PortalAffiliationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/csrf-token', fn (): array => ['data' => ['token' => csrf_token()]])
    ->name('csrf-token');

Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->name('login');

Route::get('/auth/user', [AuthenticatedSessionController::class, 'show'])
    ->middleware('auth')
    ->name('auth.user');

Route::post('/auth/password', [AuthenticatedSessionController::class, 'updatePassword'])
    ->middleware('auth')
    ->name('auth.password.update');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::post('/password/forgot', [PasswordResetController::class, 'store'])
    ->name('password.forgot');

Route::post('/password/reset', [PasswordResetController::class, 'update'])
    ->name('password.reset');

Route::prefix('affiliation-applications')->group(function (): void {
    Route::post('/', [AffiliationApplicationController::class, 'store'])
        ->middleware('throttle:affiliation-draft-create')
        ->name('affiliation-applications.store');
    Route::get('/{application}', [AffiliationApplicationController::class, 'readDraft'])
        ->middleware('signed:relative')
        ->name('affiliation-applications.read');
    Route::post('/{application}/sections/{section}', [AffiliationApplicationController::class, 'storeSection'])
        ->middleware(['signed:relative', 'throttle:affiliation-draft-write'])
        ->name('affiliation-applications.sections.store');
    Route::post('/{application}/documents', [AffiliationApplicationController::class, 'storeDocument'])
        ->middleware(['signed:relative', 'throttle:affiliation-document-upload'])
        ->name('affiliation-applications.documents.store');
    Route::get('/{application}/documents/{document}/download', [AffiliationApplicationController::class, 'downloadDocument'])
        ->middleware('signed:relative')
        ->name('affiliation-applications.documents.download');
    Route::get('/{application}/documents/{document}/preview', [AffiliationApplicationController::class, 'previewDocument'])
        ->middleware('signed:relative')
        ->name('affiliation-applications.documents.preview');
    Route::post('/{application}/consents', [AffiliationApplicationController::class, 'storeConsent'])
        ->middleware(['signed:relative', 'throttle:affiliation-draft-write'])
        ->name('affiliation-applications.consents.store');
    Route::post('/{application}/submit', [AffiliationApplicationController::class, 'submit'])
        ->middleware(['signed:relative', 'throttle:affiliation-submit'])
        ->name('affiliation-applications.submit');
});

Route::middleware(['auth', 'password.changed'])
    ->prefix('admin/affiliation-applications')
    ->name('admin.affiliation-applications.')
    ->group(function (): void {
        Route::get('/', [AffiliationApplicationController::class, 'index'])
            ->middleware('can:viewAny,App\Models\AffiliationApplication')
            ->name('index');
        Route::get('/{application}', [AffiliationApplicationController::class, 'show'])
            ->middleware('can:view,application')
            ->name('show');
        Route::post('/{application}/review', [AffiliationApplicationController::class, 'startReview'])
            ->middleware('can:startReview,application')
            ->name('review');
        Route::post('/{application}/correction', [AffiliationApplicationController::class, 'requestCorrection'])
            ->middleware('can:requestCorrection,application')
            ->name('correction');
        Route::post('/{application}/approve', [AffiliationApplicationController::class, 'approve'])
            ->middleware('can:approve,application')
            ->name('approve');
        Route::post('/{application}/signed-payroll-authorization', [AffiliationApplicationController::class, 'storeSignedPayrollAuthorization'])
            ->middleware('can:uploadSignedPayrollAuthorization,application')
            ->name('signed-payroll-authorization');
        Route::post('/{application}/enable', [AffiliationApplicationController::class, 'enable'])
            ->middleware('can:enable,application')
            ->name('enable');
        Route::post('/{application}/reject', [AffiliationApplicationController::class, 'reject'])
            ->middleware('can:reject,application')
            ->name('reject');
    });

Route::middleware(['auth', 'password.changed'])
    ->prefix('admin/associates')
    ->name('admin.associates.')
    ->group(function (): void {
        Route::post('/profile/search', [AssociateProfileController::class, 'search'])
            ->middleware('can:viewSensitiveProfiles,App\\Models\\Associate')
            ->name('profile.search');
        Route::get('/', [AssociateController::class, 'index'])
            ->middleware('can:viewAny,App\Models\Associate')
            ->name('index');
        Route::post('/', [AssociateController::class, 'store'])
            ->middleware('can:create,App\Models\Associate')
            ->name('store');
        Route::post('/{associate}/activate', [AssociateController::class, 'activate'])
            ->middleware('can:updateStatus,associate')
            ->name('activate');
        Route::post('/{associate}/deactivate', [AssociateController::class, 'deactivate'])
            ->middleware('can:updateStatus,associate')
            ->name('deactivate');
        Route::post('/{associate}/activation', [AssociateController::class, 'sendActivation'])
            ->middleware(['can:sendActivation,associate', 'throttle:associate-activation'])
            ->name('activation.send');
        Route::get('/{associate}/profile', [AssociateProfileController::class, 'show'])
            ->middleware('can:viewProfile,associate')
            ->name('profile.show');
        Route::get('/{associate}/profile/export', [AssociateProfileController::class, 'export'])
            ->middleware('can:exportProfile,associate')
            ->name('profile.export');
    });

Route::middleware(['auth', 'password.changed'])
    ->prefix('admin/credits')
    ->name('admin.credits.')
    ->group(function (): void {
        Route::get('/', [CreditAccountController::class, 'index'])
            ->middleware('can:viewAny,App\Models\CreditAccount')
            ->name('index');
        Route::post('/', [CreditAccountController::class, 'store'])
            ->middleware('can:create,App\Models\CreditAccount')
            ->name('store');
        Route::patch('/{credit}', [CreditAccountController::class, 'update'])
            ->middleware('can:update,credit')
            ->name('update');
        Route::post('/{credit}/archive', [CreditAccountController::class, 'archive'])
            ->middleware('can:archive,credit')
            ->name('archive');
    });

Route::middleware(['auth', 'password.changed'])
    ->prefix('admin/contributions')
    ->name('admin.contributions.')
    ->group(function (): void {
        Route::get('/', [ContributionController::class, 'index'])
            ->middleware('can:viewAny,App\Models\ContributionAccount')
            ->name('index');
        Route::get('/{account}/movements', [ContributionController::class, 'movements'])
            ->middleware('can:view,account')
            ->name('movements.index');
    });

Route::middleware(['auth', 'password.changed'])
    ->prefix('admin/import-batches')
    ->name('admin.import-batches.')
    ->group(function (): void {
        Route::get('/', [ImportBatchController::class, 'index'])
            ->middleware('can:viewAny,App\Models\ImportBatch')
            ->name('index');
        Route::get('/templates/credits', [ImportBatchController::class, 'creditTemplate'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('templates.credits');
        Route::get('/templates/associates', [ImportBatchController::class, 'associateTemplate'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('templates.associates');
        Route::get('/templates/contributions', [ImportBatchController::class, 'contributionTemplate'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('templates.contributions');
        Route::get('/templates/voluntary-savings', [ImportBatchController::class, 'voluntarySavingsTemplate'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('templates.voluntary-savings');
        Route::get('/templates/permanent-savings', [ImportBatchController::class, 'permanentSavingsTemplate'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('templates.permanent-savings');
        Route::get('/{batch}/errors', [ImportBatchController::class, 'errorReport'])
            ->middleware('can:viewAny,App\Models\ImportBatch')
            ->name('errors');
        Route::post('/credits', [ImportBatchController::class, 'importCredits'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('credits.store');
        Route::post('/associates', [ImportBatchController::class, 'importAssociates'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('associates.store');
        Route::post('/contributions', [ImportBatchController::class, 'importContributions'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('contributions.store');
        Route::post('/voluntary-savings', [ImportBatchController::class, 'importVoluntarySavings'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('voluntary-savings.store');
        Route::post('/permanent-savings', [ImportBatchController::class, 'importPermanentSavings'])
            ->middleware('can:import,App\Models\ImportBatch')
            ->name('permanent-savings.store');
    });

Route::middleware(['auth', 'password.changed'])
    ->get('/portal/account-statement', [PortalAccountStatementController::class, 'show'])
    ->name('portal.account-statement.show');

Route::middleware(['auth', 'password.changed'])
    ->get('/portal/credits', [CreditAccountController::class, 'mine'])
    ->name('portal.credits.index');

Route::middleware(['auth', 'password.changed'])
    ->get('/portal/contributions', [ContributionController::class, 'mine'])
    ->name('portal.contributions.index');

Route::middleware(['auth', 'password.changed'])
    ->get('/portal/affiliation', [PortalAffiliationController::class, 'show'])
    ->name('portal.affiliation.show');

Route::middleware(['auth', 'password.changed'])
    ->post('/portal/affiliation/update-draft', [PortalAffiliationController::class, 'storeUpdateDraft'])
    ->name('portal.affiliation.update-draft.store');

Route::post('/fpqrs-submissions', [FpqrsSubmissionController::class, 'store'])
    ->middleware('throttle:fpqrs-public')
    ->name('fpqrs-submissions.store');
