<?php

namespace App\Infrastructure\Mail;

use App\Application\Fpqrs\Contracts\DeliversFpqrsSubmissions;
use App\Application\Storage\Contracts\ReadsPrivateFiles;
use App\Mail\FpqrsSubmissionReceived;
use App\Models\FpqrsSubmission;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Support\ConfigurationUrlParser;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class LaravelFpqrsSubmissionMailer implements DeliversFpqrsSubmissions
{
    public function __construct(private readonly ReadsPrivateFiles $privateFiles) {}

    public function deliver(FpqrsSubmission $submission): void
    {
        $recipient = config('services.fpqrs.recipient_email');

        if (! is_string($recipient) || trim($recipient) === '') {
            throw new RuntimeException('FPQRS recipient email is not configured.');
        }

        if (app()->environment('production')) {
            $this->assertDeliveryTransport((string) config('mail.default'));
        }

        $attachment = $this->attachment($submission);
        $sent = Mail::to($recipient)->send(new FpqrsSubmissionReceived($submission, $attachment));

        if ($sent === null) {
            throw new RuntimeException('FPQRS mail was not accepted by the transport.');
        }
    }

    /** @param array<int, string> $visited */
    private function assertDeliveryTransport(string $name, array $visited = []): void
    {
        $configuration = config('mail.driver') ? config('mail') : config('mail.mailers.'.$name);
        if (! is_array($configuration)) {
            throw new RuntimeException('FPQRS delivery transport is not configured.');
        }
        // Match MailManager::getConfig, including URL query overrides, before
        // authorizing this transport or any of its fallback children.
        if (isset($configuration['url'])) {
            $configuration = array_merge($configuration, (new ConfigurationUrlParser)->parseConfiguration($configuration));
            $configuration['transport'] = $configuration['driver'] ?? null;
        }
        $transport = $configuration['transport'] ?? config('mail.driver');
        if (in_array($name, $visited, true) || ! is_string($transport)
            || in_array($transport, ['log', 'array'], true)) {
            throw new RuntimeException('FPQRS requires a delivery transport in production.');
        }

        if (in_array($transport, ['failover', 'roundrobin'], true)) {
            $mailers = $configuration['mailers'] ?? null;
            if (! is_array($mailers) || $mailers === []) {
                throw new RuntimeException('FPQRS delivery transports are not configured.');
            }
            foreach ($mailers as $mailer) {
                if (! is_string($mailer) || $mailer === '') {
                    throw new RuntimeException('Invalid FPQRS fallback transport.');
                }
                $this->assertDeliveryTransport($mailer, [...$visited, $name]);
            }
        }
    }

    private function attachment(FpqrsSubmission $submission): ?Attachment
    {
        if ($submission->attachment_storage_key === null) {
            return null;
        }

        $extension = match ($submission->attachment_mime_type) {
            'application/pdf' => 'pdf',
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            default => throw new RuntimeException('Invalid FPQRS attachment type.'),
        };
        $key = $submission->attachment_storage_key;
        if (! str_starts_with($key, 'fpqrs-submissions/'.$submission->id.'/attachments/')
            || str_contains($key, '..') || str_contains($key, '\\')) {
            throw new RuntimeException('Invalid FPQRS attachment storage key.');
        }

        $stream = $this->privateFiles->open($key);
        if (! is_resource($stream)) {
            throw new RuntimeException('FPQRS attachment is missing.');
        }

        try {
            // Bound memory usage and reject partial reads instead of sending an incomplete file.
            $contents = stream_get_contents($stream, 5 * 1024 * 1024 + 1);
            if ($contents === false || $contents === '' || strlen($contents) > 5 * 1024 * 1024
                || strlen($contents) !== (int) $submission->attachment_byte_size) {
                throw new RuntimeException('FPQRS attachment could not be read completely.');
            }
        } finally {
            fclose($stream);
        }

        // Never put user-controlled filenames or storage paths into MIME headers.
        return Attachment::fromData(fn () => $contents, 'adjunto-fpqrs.'.$extension)
            ->withMime($submission->attachment_mime_type);
    }
}
