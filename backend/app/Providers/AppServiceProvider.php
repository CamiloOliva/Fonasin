<?php

namespace App\Providers;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Storage\Contracts\GeneratesPrivateStorageKeys;
use App\Infrastructure\Security\LaravelSensitiveDataCipher;
use App\Infrastructure\Storage\LaravelPrivateStorageKeyGenerator;
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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
