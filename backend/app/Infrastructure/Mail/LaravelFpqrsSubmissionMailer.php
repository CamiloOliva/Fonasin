<?php

namespace App\Infrastructure\Mail;

use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Mail\FpqrsSubmissionReceived;
use App\Models\FpqrsSubmission;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class LaravelFpqrsSubmissionMailer implements DeliversFpqrsSubmissions
{
    public function deliver(FpqrsSubmission $submission): void
    {
        $recipient = config('services.fpqrs.recipient_email');

        if (! is_string($recipient) || trim($recipient) === '') {
            throw new RuntimeException('FPQRS recipient email is not configured.');
        }

        Mail::to($recipient)->send(new FpqrsSubmissionReceived($submission));
    }
}
