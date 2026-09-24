<?php

namespace App\Infrastructure\Contributions;

use App\Application\Contributions\Contracts\RendersVoluntarySavingsPayrollAuthorization;
use Barryvdh\DomPDF\Facade\Pdf;

class LaravelDompdfVoluntarySavingsPayrollAuthorizationRenderer implements RendersVoluntarySavingsPayrollAuthorization
{
    public function render(array $data): string
    {
        return Pdf::loadView('pdf.contributions.voluntary-savings-payroll-authorization', [
            ...$data,
            'logoDataUri' => $this->logoDataUri(),
        ])->output();
    }

    private function logoDataUri(): ?string
    {
        $path = base_path('../public/logotipo.png');

        if (! is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);

        return $contents === false ? null : 'data:image/png;base64,'.base64_encode($contents);
    }
}
