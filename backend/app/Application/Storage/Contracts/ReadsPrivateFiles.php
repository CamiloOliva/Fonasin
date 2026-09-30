<?php

namespace App\Application\Storage\Contracts;

interface ReadsPrivateFiles
{
    /** @return resource|null Caller owns the stream and must close it. */
    public function open(string $storageKey): mixed;
}
