<?php

namespace App\Providers;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Affiliation\Contracts\RendersAffiliationSubmissionDocuments;
use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Infrastructure\Mail\LaravelFpqrsSubmissionMailer;
use App\Infrastructure\Affiliation\LaravelDompdfAffiliationSubmissionRenderer;
use App\Infrastructure\Security\LaravelSensitiveDataCipher;
use App\Infrastructure\Storage\LaravelPrivateFileStorage;
use App\Infrastructure\Storage\LaravelPrivateStorageKeyGenerator;
use App\Models\AffiliationApplication;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Policies\AffiliationApplicationPolicy;
use App\Policies\AssociatePolicy;
use App\Policies\CreditAccountPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(EncryptsSensitiveData::class, LaravelSensitiveDataCipher::class);
        $this->app->bind(RendersAffiliationSubmissionDocuments::class, LaravelDompdfAffiliationSubmissionRenderer::class);
        $this->app->bind(DeliversFpqrsSubmissions::class, LaravelFpqrsSubmissionMailer::class);
        $this->app->bind(GeneratesPrivateStorageKeys::class, LaravelPrivateStorageKeyGenerator::class);
        $this->app->bind(StoresPrivateFiles::class, LaravelPrivateFileStorage::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(AffiliationApplication::class, AffiliationApplicationPolicy::class);
        Gate::policy(Associate::class, AssociatePolicy::class);
        Gate::policy(CreditAccount::class, CreditAccountPolicy::class);

        RateLimiter::for('affiliation-draft-create', function (Request $request): Limit {
            return Limit::perMinute(30)->by('affiliation-draft-create|'.$request->ip());
        });

        RateLimiter::for('affiliation-draft-write', function (Request $request): Limit {
            return Limit::perMinute(90)->by('affiliation-draft-write|'.$this->applicationThrottleKey($request));
        });

        RateLimiter::for('affiliation-document-upload', function (Request $request): Limit {
            return Limit::perMinute(12)->by('affiliation-document-upload|'.$this->applicationThrottleKey($request));
        });

        RateLimiter::for('affiliation-submit', function (Request $request): Limit {
            return Limit::perMinute(10)->by('affiliation-submit|'.$this->applicationThrottleKey($request));
        });

        RateLimiter::for('fpqrs-public', function (Request $request): Limit {
            $email = strtolower(trim((string) $request->input('email', '')));

            return Limit::perMinute(3)->by('fpqrs-public|'.$request->ip().'|'.hash('sha256', $email));
        });
    }

    private function applicationThrottleKey(Request $request): string
    {
        $application = $request->route('application');
        $applicationId = is_object($application) && method_exists($application, 'getKey')
            ? (string) $application->getKey()
            : (string) $application;

        return $request->ip().'|'.$applicationId;
    }
}
