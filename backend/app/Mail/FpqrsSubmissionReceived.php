<?php

namespace App\Mail;

use App\Models\FpqrsSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FpqrsSubmissionReceived extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly FpqrsSubmission $submission,
        private readonly ?Attachment $privateAttachment,
    ) {}

    /** @return array<int, Attachment> */
    public function attachments(): array
    {
        return $this->privateAttachment === null ? [] : [$this->privateAttachment];
    }

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
