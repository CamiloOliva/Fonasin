<?php

namespace Tests\Unit;

use App\Infrastructure\Storage\LaravelPrivateFileStorage;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class LaravelPrivateFileStorageTest extends TestCase
{
    public function test_it_throws_when_private_file_cannot_be_written(): void
    {
        Storage::shouldReceive('disk')
            ->once()
            ->with('local')
            ->andReturn(new class
            {
                public function put(string $path, string $contents): bool
                {
                    return false;
                }
            });

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No fue posible guardar el archivo privado.');

        (new LaravelPrivateFileStorage)->put('private/test.pdf', 'contents');
    }
}
