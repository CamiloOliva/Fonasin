<?php

namespace App\Application\Portal\Contracts;

interface ExportsAssociateProfiles
{
    /**
     * @param  array<string, mixed>  $profile
     */
    public function spreadsheet(array $profile): string;
}
