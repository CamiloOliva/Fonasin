<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\Associate;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\Support\ProcessOutputMarker;
use Tests\TestCase;

class CreditMutationConcurrencyTest extends TestCase
{
    use DatabaseTruncation;

    protected function beforeTruncatingDatabase(): void
    {
        if (DB::getDriverName() === 'mariadb' && DB::connection()->getDatabaseName() !== 'fonasin_test') {
            throw new \RuntimeException('Credit contention tests require fonasin_test.');
        }
    }

    protected function tearDown(): void
    {
        $this->truncateTablesForAllConnections();
        parent::tearDown();
    }

    public static function operations(): array
    {
        return [['update', 'archive'], ['archive', 'update'], ['archive', 'import']];
    }

    #[DataProvider('operations')]
    public function test_real_row_contention_preserves_archive_and_financial_audit_order(string $firstOperation, string $secondOperation): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('Requires real InnoDB row contention, not SQLite.');
        }
        $admin = User::factory()->create();
        $hasher = app(HashesSensitiveData::class);
        $associate = Associate::query()->create([
            'document_type' => 'CC', 'document_number_hash' => $hasher->documentNumber('123456789'),
            'document_number_encrypted' => 'synthetic-test-only', 'full_name' => 'Synthetic Concurrent Credit', 'status' => 'active',
        ]);
        $credit = CreditAccount::query()->create([
            'associate_id' => $associate->id, 'registered_by_user_id' => $admin->id, 'credit_line' => 'FONALIBRE',
            'promissory_note_number_hash' => $hasher->financialReference('CONCURRENT-CREDIT'),
            'initial_balance' => '1000.00', 'current_balance' => '900.00', 'installment_amount' => '100.00',
            'term_months' => 12, 'interest_rate' => '1.5000', 'status' => 'active',
        ]);
        $directory = realpath(sys_get_temp_dir()).DIRECTORY_SEPARATOR.'fonasin-credit-lock-'.bin2hex(random_bytes(8));
        $this->assertTrue(mkdir($directory, 0700));
        $release = $directory.DIRECTORY_SEPARATOR.'release';
        $first = $this->worker($admin->id, $credit->id, $firstOperation, $release);
        $second = $this->worker($admin->id, $credit->id, $secondOperation);
        try {
            $first->start();
            $this->assertTrue((new ProcessOutputMarker('LOCKED'))->waitFor($first), $first->getErrorOutput());
            $baseline = (int) DB::selectOne("SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_current_waits'")->Value;
            $second->start();
            $this->assertTrue((new ProcessOutputMarker('WAITING'))->waitFor($second), $second->getErrorOutput());
            $deadline = microtime(true) + 5;
            do {
                $waits = (int) DB::selectOne("SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_current_waits'")->Value;
                if ($waits > $baseline) {
                    break;
                }
                usleep(10_000);
            } while (microtime(true) < $deadline);
            $this->assertGreaterThan($baseline, $waits, 'The second writer must actually wait in InnoDB.');
            $this->assertStringNotContainsString('LOCKED', $second->getOutput());
            $this->assertSame(2, file_put_contents($release, 'go'));
            $first->wait();
            $second->wait();
            $this->assertSame(0, $first->getExitCode(), $first->getErrorOutput());
            $this->assertSame(0, $second->getExitCode(), $second->getErrorOutput());
            $this->assertStringContainsString('RESULT '.($firstOperation === 'update' ? 'updated' : 'archived'), $first->getOutput());
            if ($secondOperation !== 'import') {
                $this->assertStringContainsString('RESULT '.($secondOperation === 'update' ? 'rejected_archived' : 'archived'), $second->getOutput());
            }
            $this->assertSame('archived', $credit->fresh()->status, $first->getOutput().$second->getOutput());
            $this->assertSame($firstOperation === 'update' ? '777.33' : '900.00', $credit->fresh()->current_balance);
            $this->assertSame($firstOperation === 'update' ? '2026-10-31' : null, $credit->fresh()->last_payment_date?->toDateString());
            $this->assertSame(1, CreditAccount::query()->count());
            $this->assertSame($firstOperation === 'update' ? 1 : 0, DB::table('audit_events')->where('subject_id', $credit->id)->where('action', 'credit.updated')->count());
            $this->assertSame(1, DB::table('audit_events')->where('subject_id', $credit->id)->where('action', 'credit.archived')->count());
            if ($secondOperation === 'import') {
                $this->assertStringContainsString('IMPORT_REJECTED=1', $second->getOutput());
            }
        } finally {
            if ($first->isRunning()) {
                $first->stop();
            }
            if ($second->isRunning()) {
                $second->stop();
            }
            if (is_file($release) && ! is_link($release)) {
                unlink($release);
            }
            rmdir($directory);
        }
    }

    private function worker(string $admin, string $credit, string $operation, string $release = ''): Process
    {
        $connection = config('database.connections.mariadb');

        return new Process([PHP_BINARY, base_path('tests/Fixtures/credit-mutation-worker.php'), $admin, $credit, $operation, $release], base_path(), [
            'APP_ENV' => 'testing', 'APP_KEY' => config('app.key'), 'DATA_HASH_PEPPER' => config('security.hashing.pepper'),
            'DB_CONNECTION' => 'mariadb', 'DB_URL' => '', 'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_DATABASE' => $connection['database'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array',
        ], null, 60);
    }
}
