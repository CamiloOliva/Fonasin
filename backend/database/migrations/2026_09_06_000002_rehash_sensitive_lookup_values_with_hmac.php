<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->rehashDocumentNumbers('users', useHmac: true);
        $this->rehashDocumentNumbers('associates', useHmac: true);
        $this->rehashEmails('fpqrs_submissions', useHmac: true);
    }

    public function down(): void
    {
        $this->rehashDocumentNumbers('users', useHmac: false);
        $this->rehashDocumentNumbers('associates', useHmac: false);
        $this->rehashEmails('fpqrs_submissions', useHmac: false);
    }

    private function rehashDocumentNumbers(string $table, bool $useHmac): void
    {
        DB::table($table)
            ->select(['id', 'document_number_encrypted'])
            ->whereNotNull('document_number_hash')
            ->whereNotNull('document_number_encrypted')
            ->orderBy('id')
            ->chunk(100, function ($records) use ($table, $useHmac): void {
                foreach ($records as $record) {
                    $documentNumber = $this->decryptDocumentNumber((string) $record->document_number_encrypted);

                    if ($documentNumber === null) {
                        continue;
                    }

                    DB::table($table)
                        ->where('id', $record->id)
                        ->update([
                            'document_number_hash' => $this->digest(strtoupper(trim($documentNumber)), $useHmac),
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    private function rehashEmails(string $table, bool $useHmac): void
    {
        DB::table($table)
            ->select(['id', 'email'])
            ->whereNotNull('email_hash')
            ->orderBy('id')
            ->chunk(100, function ($records) use ($table, $useHmac): void {
                foreach ($records as $record) {
                    $email = strtolower(trim((string) $record->email));

                    if ($email === '') {
                        continue;
                    }

                    DB::table($table)
                        ->where('id', $record->id)
                        ->update([
                            'email_hash' => $this->digest($email, $useHmac),
                            'updated_at' => now(),
                        ]);
                }
            });
    }

    private function decryptDocumentNumber(string $encrypted): ?string
    {
        try {
            $decrypted = Crypt::decryptString($encrypted);
        } catch (\Throwable) {
            return null;
        }

        $decoded = json_decode($decrypted, true);

        if (is_array($decoded) && is_string($decoded['document_number'] ?? null)) {
            return $decoded['document_number'];
        }

        return is_string($decrypted) && trim($decrypted) !== '' ? $decrypted : null;
    }

    private function digest(string $value, bool $useHmac): string
    {
        if (! $useHmac) {
            return hash('sha256', $value);
        }

        return hash_hmac('sha256', $value, $this->pepper());
    }

    private function pepper(): string
    {
        return (string) (config('security.hashing.pepper') ?: config('app.key'));
    }
};
