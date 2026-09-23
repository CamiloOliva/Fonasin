<?php

namespace App\Infrastructure\Contributions;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsAuthorization;
use Barryvdh\DomPDF\Facade\Pdf;

class LaravelDompdfVoluntarySavingsAuthorizationRenderer implements RendersVoluntarySavingsAuthorization
{
    public function render(array $data): string
    {
        return Pdf::loadView('pdf.contributions.voluntary-savings-authorization', $data)
            ->setPaper('letter')
            ->output();
    }
}
