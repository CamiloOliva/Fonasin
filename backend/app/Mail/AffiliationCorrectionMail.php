<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AffiliationCorrectionMail extends Mailable
{
    public function __construct(public readonly string $correctionUrl) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Correccion de solicitud - FONASIN');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.affiliation.correction');
    }
}
