<?php

namespace App\Infrastructure\Storage;

use App\Application\Storage\Contracts\StoresPrivateFiles;
use Illuminate\Support\Facades\Storage;

class LaravelPrivateFileStorage implements StoresPrivateFiles
{
    public function put(string $storageKey, string $contents): void
    {
        Storage::disk('local')->put($storageKey, $contents);
    }
}
