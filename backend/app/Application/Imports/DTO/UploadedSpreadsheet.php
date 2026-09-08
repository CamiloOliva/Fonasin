<?php

namespace App\Application\Imports\DTO;

final readonly class UploadedSpreadsheet
{
    public function __construct(
        public string $path,
        public string $contents,
        public string $originalName,
        public string $extension,
        public string $mimeType,
        public int $byteSize,
    ) {}
}
