<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Process\Process;
use Tests\Support\ProcessOutputMarker;
use Tests\TestCase;

class IdentityEmailConcurrencyTest extends TestCase
{
    use DatabaseTruncation;

    protected function beforeTruncatingDatabase(): void
    {
        if (DB::getDriverName() === 'mariadb' && DB::connection()->getDatabaseName() !== 'fonasin_test') {
            throw new \RuntimeException('Identity contention requires isolated fonasin_test.');
        }
    }

    protected function tearDown(): void
    {
        $this->truncateTablesForAllConnections();
        parent::tearDown();
    }

    public static function races(): array
    {
        return [['correct', 'reset'], ['reset', 'correct'], ['correct', 'request'], ['request', 'correct']];
    }

    #[DataProvider('races')]
    public function test_email_correction_serializes_password_recovery_without_deadlocks_or_old_tokens(string $firstOperation, string $secondOperation): void
    {
        if (DB::getDriverName() !== 'mariadb') {
            $this->markTestSkipped('Requires actual InnoDB contention.');
        }
        $admin = User::factory()->create();
        $admin->roles()->attach(Role::firstOrCreate(['name' => 'admin']));
        $user = User::factory()->create(['email' => 'before-concurrency@example.test', 'status' => 'active', 'must_change_password' => true]);
        $user->roles()->attach(Role::firstOrCreate(['name' => 'associate']));
        $associate = Associate::create([
            'user_id' => $user->id, 'full_name' => 'Synthetic Concurrent Identity', 'document_type' => 'CC',
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('1234567890'),
            'document_number_encrypted' => 'synthetic', 'status' => 'active',
        ]);
        DB::table('password_reset_tokens')->insert(['email' => $user->email, 'token' => Hash::make('synthetic-race-token'), 'created_at' => now()]);
        $directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'fonasin-identity-'.bin2hex(random_bytes(8));
        $this->assertTrue(mkdir($directory, 0700));
        $release = $directory.DIRECTORY_SEPARATOR.'release';
        $first = $this->worker($admin->id, $associate->id, $firstOperation, $release);
        $second = $this->worker($admin->id, $associate->id, $secondOperation);
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
            $this->assertGreaterThan($baseline, $waits, 'Recovery must actually wait for the user lock.');
            file_put_contents($release, 'go');
            $first->wait();
            $second->wait();
            $this->assertSame(0, $first->getExitCode(), $first->getErrorOutput());
            $this->assertSame(0, $second->getExitCode(), $second->getErrorOutput());
            $this->assertSame('after-concurrency@example.test', $user->refresh()->email);
            $this->assertSame('inactive', $user->status);
            $this->assertTrue($user->must_change_password);
            $this->assertSame('inactive', $associate->refresh()->status);
            $this->assertFalse(Hash::check('SyntheticReset123!', $user->password));
            $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'before-concurrency@example.test']);
            $this->assertDatabaseMissing('password_reset_tokens', ['email' => 'after-concurrency@example.test']);
            $this->assertSame(1, DB::table('audit_events')->where('action', 'user.email_corrected')->count());
            $output = $first->getOutput().$second->getOutput();
            if ($firstOperation === 'correct' && $secondOperation === 'reset') {
                $this->assertStringContainsString('RESULT revoked', $output);
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

    private function worker(string $admin, string $associate, string $operation, string $release = ''): Process
    {
        $connection = config('database.connections.mariadb');

        return new Process([PHP_BINARY, base_path('tests/Fixtures/identity-email-worker.php'), $admin, $associate, $operation, $release], base_path(), [
            'APP_ENV' => 'testing', 'APP_KEY' => config('app.key'), 'DATA_HASH_PEPPER' => config('security.hashing.pepper'),
            'DB_CONNECTION' => 'mariadb', 'DB_URL' => '', 'DB_HOST' => $connection['host'], 'DB_PORT' => (string) $connection['port'],
            'DB_DATABASE' => $connection['database'], 'DB_USERNAME' => $connection['username'], 'DB_PASSWORD' => $connection['password'],
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array',
        ], null, 60);
    }
}
