<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\ImportBatch;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use Tests\Support\ProcessOutputMarker;
use Tests\TestCase;

class ContributionImportConcurrencyTest extends TestCase
{
    use DatabaseTruncation;

    protected function beforeTruncatingDatabase(): void
    {
        if (DB::getDriverName() === 'mariadb' && DB::connection()->getDatabaseName() !== 'fonasin_test') {
            throw new \RuntimeException('Concurrency fixtures may only use the isolated fonasin_test database.');
        }
    }

    protected function tearDown(): void
    {
        $this->truncateTablesForAllConnections();
        parent::tearDown();
    }

    public function test_two_processes_serialize_same_associate_corrections_on_mariadb(): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('Row-lock contention must be verified against MariaDB, not SQLite.');
        }
        $admin = User::factory()->create(['status' => 'active']);
        Associate::query()->create([
            'document_type' => 'CC', 'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('123456789'),
            'document_number_encrypted' => 'synthetic-test-only', 'full_name' => 'Synthetic Concurrent Associate', 'status' => 'active',
        ]);
        $lockRelease = tempnam(sys_get_temp_dir(), 'fonasin-lock-release-');
        $this->assertIsString($lockRelease);
        unlink($lockRelease);
        $first = $this->worker($admin->id, '100.00', 0, lockReleaseFile: $lockRelease);
        $second = $this->worker($admin->id, '200.00', 0);
        try {
            $first->start();
            $locked = (new ProcessOutputMarker('LOCKED'))->waitFor($first);
            $this->assertTrue($locked, $first->getOutput().$first->getErrorOutput());
            $baselineWaits = (int) DB::selectOne("SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_current_waits'")->Value;
            $second->start();
            $this->assertTrue((new ProcessOutputMarker('WAITING'))->waitFor($second), $second->getOutput().$second->getErrorOutput());
            $deadline = microtime(true) + 5;
            do {
                $waits = (int) DB::selectOne("SHOW GLOBAL STATUS LIKE 'Innodb_row_lock_current_waits'")->Value;
                if ($waits > $baselineWaits) {
                    break;
                }
                usleep(10_000);
            } while (microtime(true) < $deadline);
            $this->assertGreaterThan($baselineWaits, $waits, 'MariaDB must report a real row-lock wait before the first worker is released.');
            $this->assertStringNotContainsString('LOCKED', $second->getOutput(), 'The second transaction cannot acquire the row before release.');
            $this->assertSame(2, file_put_contents($lockRelease, 'go'), 'The first worker must receive an actual release signal.');
            $first->wait();
            $second->wait();
            $this->assertSame(0, $first->getExitCode(), $first->getErrorOutput());
            $this->assertSame(0, $second->getExitCode(), $second->getErrorOutput());
            preg_match('/LOCKED ([0-9.]+)/', $second->getOutput(), $match);
            $this->assertNotEmpty($match, 'Second worker did not perform its locking read.');
            $this->assertSame(1, ContributionMovement::query()->where('status', 'registered')->count());
            $this->assertSame(1, ContributionMovement::query()->where('status', 'reversed')->count());
            $this->assertSame('200.00', ContributionAccount::query()->firstOrFail()->total_balance);
            $this->assertSame(2, ImportBatch::query()->where('status', 'completed')->count());
        } finally {
            if ($first->isRunning()) {
                $first->stop();
            }
            if ($second->isRunning()) {
                $second->stop();
            }
            if (is_file($lockRelease)) {
                unlink($lockRelease);
            }
        }
    }

    public function test_simultaneous_identical_files_create_one_batch_and_one_private_file_on_mariadb(): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('The duplicate race requires MariaDB processes.');
        }

        $admin = User::factory()->create(['status' => 'active']);
        Associate::query()->create([
            'document_type' => 'CC', 'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('123456789'),
            'document_number_encrypted' => 'synthetic-test-only', 'full_name' => 'Synthetic Concurrent Associate', 'status' => 'active',
        ]);
        $releaseFile = tempnam(sys_get_temp_dir(), 'fonasin-import-release-');
        $storageLog = tempnam(sys_get_temp_dir(), 'fonasin-import-storage-');
        $this->assertIsString($releaseFile);
        $this->assertIsString($storageLog);
        unlink($releaseFile);
        $first = $this->worker($admin->id, '100.00', 0, $releaseFile, $storageLog);
        $second = $this->worker($admin->id, '100.00', 0, $releaseFile, $storageLog);

        try {
            $first->start();
            $this->assertTrue((new ProcessOutputMarker('CHECKED'))->waitFor($first), $first->getOutput().$first->getErrorOutput());
            $second->start();
            $this->assertTrue((new ProcessOutputMarker('CHECKED'))->waitFor($second), $second->getOutput().$second->getErrorOutput());
            $this->assertSame(2, file_put_contents($releaseFile, 'go'), 'Both workers must receive an actual release signal.');
            $first->wait();
            $second->wait();
            $this->assertSame(0, $first->getExitCode(), $first->getErrorOutput());
            $this->assertSame(0, $second->getExitCode(), $second->getErrorOutput());
            $output = $first->getOutput().$second->getOutput();
            $this->assertSame(1, substr_count($output, 'RESULT completed'));
            $this->assertSame(1, substr_count($output, 'DUPLICATE '));
            $this->assertSame(1, ImportBatch::query()->count());
            $this->assertSame(1, ContributionMovement::query()->count());
            $this->assertCount(1, file($storageLog, FILE_IGNORE_NEW_LINES));
        } finally {
            if ($first->isRunning()) {
                $first->stop();
            }
            if ($second->isRunning()) {
                $second->stop();
            }
            if (is_file($releaseFile)) {
                unlink($releaseFile);
            }
            if (is_file($storageLog)) {
                unlink($storageLog);
            }
        }
    }

    private function worker(string $adminId, string $amount, int $delay, ?string $releaseFile = null, ?string $storageLog = null, ?string $lockReleaseFile = null): Process
    {
        $connection = config('database.connections.mariadb');

        return new Process([PHP_BINARY, base_path('tests/Fixtures/contribution-import-worker.php'), $adminId, $amount, (string) $delay, $releaseFile ?? '', $storageLog ?? '', $lockReleaseFile ?? ''], base_path(), [
            'APP_ENV' => 'testing', 'APP_KEY' => config('app.key'), 'DATA_HASH_PEPPER' => config('security.hashing.pepper'),
            'DB_CONNECTION' => 'mariadb', 'DB_URL' => '', 'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_DATABASE' => $connection['database'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array',
        ], null, 60);
    }
}
