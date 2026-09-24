<?php

namespace App\Infrastructure\Storage;

use App\Application\Storage\Contracts\StoresPrivateFiles;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LaravelPrivateFileStorage implements StoresPrivateFiles
{
    public function put(string $storageKey, string $contents): void
    {
        if (! Storage::disk('local')->put($storageKey, $contents)) {
            throw new RuntimeException('No fue posible guardar el archivo privado.');
        }
    }
}
