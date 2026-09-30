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
        $first = $this->worker($admin->id, '100.00', 2000);
        $second = $this->worker($admin->id, '200.00', 0);
        try {
            $first->start();
            $locked = $first->waitUntil(fn ($type, $output): bool => str_contains($output, 'LOCKED'));
            $this->assertTrue($locked, $first->getErrorOutput());
            $second->start();
            $first->wait();
            $second->wait();
            $this->assertSame(0, $first->getExitCode(), $first->getErrorOutput());
            $this->assertSame(0, $second->getExitCode(), $second->getErrorOutput());
            preg_match('/LOCKED ([0-9.]+)/', $second->getOutput(), $match);
            $this->assertNotEmpty($match, 'Second worker did not perform its locking read.');
            $this->assertGreaterThan(300, (float) $match[1], 'Second transaction must actually wait for the first transaction lock.');
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
        }
    }

    private function worker(string $adminId, string $amount, int $delay): Process
    {
        $connection = config('database.connections.mariadb');

        return new Process([PHP_BINARY, base_path('tests/Fixtures/contribution-import-worker.php'), $adminId, $amount, (string) $delay], base_path(), [
            'APP_ENV' => 'testing', 'APP_KEY' => config('app.key'), 'DATA_HASH_PEPPER' => config('security.hashing.pepper'),
            'DB_CONNECTION' => 'mariadb', 'DB_URL' => '', 'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_DATABASE' => $connection['database'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array',
        ], null, 20);
    }
}
