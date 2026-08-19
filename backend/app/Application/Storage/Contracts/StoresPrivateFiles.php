<?php

namespace App\Application\Storage\Contracts;

interface StoresPrivateFiles
{
    public function put(string $storageKey, string $contents): void;
}
