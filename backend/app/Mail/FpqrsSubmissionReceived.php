<?php

namespace App\Mail;

use App\Models\FpqrsSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FpqrsSubmissionReceived extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly FpqrsSubmission $submission) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nueva FPQRS recibida - '.$this->submission->submission_type,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.fpqrs.submission-received',
        );
    }
}
