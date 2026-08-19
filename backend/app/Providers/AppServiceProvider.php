<?php

namespace App\Providers;

use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Infrastructure\Security\LaravelSensitiveDataCipher;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(EncryptsSensitiveData::class, LaravelSensitiveDataCipher::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
