<?php

namespace App\Infrastructure\Storage;

use App\Application\Storage\Contracts\ReadsPrivateFiles;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class LaravelPrivateFileReader implements ReadsPrivateFiles
{
    public function open(string $storageKey): mixed
    {
        $disk = Storage::disk('local');
        if ($storageKey === '' || ! $disk->exists($storageKey)) {
            return null;
        }
        $stream = $disk->readStream($storageKey);
        if (! is_resource($stream)) {
            throw new RuntimeException('No fue posible leer el documento privado.');
        }

        return $stream;
    }
}
