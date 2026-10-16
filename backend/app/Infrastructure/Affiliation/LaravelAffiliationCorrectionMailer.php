<?php

namespace App\Infrastructure\Affiliation;

use App\Application\Affiliation\Contracts\DeliversAffiliationCorrections;
use App\Mail\AffiliationCorrectionMail;
use App\Models\AffiliationApplication;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;

class LaravelAffiliationCorrectionMailer implements DeliversAffiliationCorrections
{
    public function send(AffiliationApplication $application, string $email, string $token, Carbon $expiresAt): void
    {
        $read = URL::temporarySignedRoute('affiliation-applications.read', $expiresAt, ['application' => $application], false);
        // Fragment secrets are not sent to the web server or in the Referer.
        $url = rtrim((string) config('services.frontend.url'), '/').'/afiliacion#'.http_build_query([
            'correction' => $application->id, 'purpose' => $application->purpose,
            'read' => $read, 'token' => $token,
        ], '', '&', PHP_QUERY_RFC3986);
        try {
            Mail::to($email)->send(new AffiliationCorrectionMail($url));
        } catch (\Throwable) {
            throw new \DomainException('No fue posible enviar el enlace de correccion. Intenta nuevamente.');
        }
    }
}
