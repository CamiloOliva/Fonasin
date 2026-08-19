<?php

namespace App\Providers;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Infrastructure\Security\LaravelSensitiveDataCipher;
use App\Infrastructure\Storage\LaravelPrivateFileStorage;
use App\Infrastructure\Storage\LaravelPrivateStorageKeyGenerator;
use App\Models\AffiliationApplication;
use App\Models\CreditAccount;
use App\Policies\AffiliationApplicationPolicy;
use App\Policies\CreditAccountPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(EncryptsSensitiveData::class, LaravelSensitiveDataCipher::class);
        $this->app->bind(GeneratesPrivateStorageKeys::class, LaravelPrivateStorageKeyGenerator::class);
        $this->app->bind(StoresPrivateFiles::class, LaravelPrivateFileStorage::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(AffiliationApplication::class, AffiliationApplicationPolicy::class);
        Gate::policy(CreditAccount::class, CreditAccountPolicy::class);
    }
}
