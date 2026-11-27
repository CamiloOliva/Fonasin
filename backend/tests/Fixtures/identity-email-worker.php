<?php

use App\Application\Affiliation\UseCases\CorrectAssociateEmail;
use App\Application\Identity\UseCases\RequestPasswordReset;
use App\Application\Identity\UseCases\ResetPassword;
use App\Models\Associate;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || DB::getDriverName() !== 'mariadb' || DB::connection()->getDatabaseName() !== 'fonasin_test') {
    throw new RuntimeException('Identity workers require isolated fonasin_test.');
}
[$script, $adminId, $associateId, $operation] = $argv;
$release = ($argv[4] ?? '') ?: null;
Mail::fake();
DB::connection()->beforeExecuting(function (string $sql): void {
    if (str_contains($sql, 'from `users`') && str_contains($sql, 'for update')) {
        echo 'WAITING'.PHP_EOL;
        flush();
    }
});
$paused = false;
DB::listen(function ($event) use ($release, &$paused): void {
    if ($paused || ! str_contains($event->sql, 'from `users`') || ! str_contains($event->sql, 'for update')) {
        return;
    }
    $paused = true;
    echo 'LOCKED'.PHP_EOL;
    flush();
    if ($release === null) {
        return;
    }
    $deadline = microtime(true) + 45;
    do {
        clearstatcache(true, $release);
        if (is_file($release)) {
            return;
        }
        usleep(10_000);
    } while (microtime(true) < $deadline);
    throw new RuntimeException('Identity lock release timed out.');
});
try {
    if ($operation === 'correct') {
        app(CorrectAssociateEmail::class)(Associate::findOrFail($associateId), 'after-concurrency@example.test', 'before-concurrency@example.test', User::findOrFail($adminId), null);
    } elseif ($operation === 'reset') {
        app(ResetPassword::class)('before-concurrency@example.test', 'synthetic-race-token', 'SyntheticReset123!');
    } elseif ($operation === 'request') {
        app(RequestPasswordReset::class)('before-concurrency@example.test', '1234567890');
    } else {
        throw new RuntimeException('Invalid operation.');
    }
    echo 'RESULT '.$operation.PHP_EOL;
} catch (ValidationException) {
    if ($operation !== 'reset') {
        exit(1);
    }
    echo 'RESULT revoked'.PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, 'WORKER_ERROR '.$exception::class.PHP_EOL);
    exit(1);
}
