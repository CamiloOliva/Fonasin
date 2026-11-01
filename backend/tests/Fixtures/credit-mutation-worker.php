<?php

use App\Application\Credits\Exceptions\CannotManageCreditAccount;
use App\Application\Credits\UseCases\ArchiveCreditAccount;
use App\Application\Credits\UseCases\UpdateCreditAccount;
use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\UseCases\ImportCreditAccounts;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Models\CreditAccount;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || DB::getDriverName() !== 'mariadb' || DB::connection()->getDatabaseName() !== 'fonasin_test') {
    throw new RuntimeException('Credit workers require the isolated MariaDB testing database.');
}
[$script, $adminId, $creditId, $operation] = $argv;
$release = ($argv[4] ?? '') ?: null;
DB::connection()->beforeExecuting(function (string $sql): void {
    if ((str_contains($sql, 'from `credit_accounts`') || str_contains($sql, 'from `associates`')) && str_contains($sql, 'for update')) {
        echo 'WAITING'.PHP_EOL;
        flush();
    }
});
DB::listen(function ($event) use ($release): void {
    if (! str_contains($event->sql, 'from `credit_accounts`') || ! str_contains($event->sql, 'for update')) {
        return;
    }
    echo 'LOCKED'.PHP_EOL;
    flush();
    if ($release !== null) {
        $deadline = microtime(true) + 45;
        do {
            clearstatcache(true, $release);
            if (is_file($release)) {
                return;
            }
            usleep(10_000);
        } while (microtime(true) < $deadline);
        throw new RuntimeException('Timed out awaiting test lock release.');
    }
});
$admin = User::query()->findOrFail($adminId);
$credit = CreditAccount::query()->findOrFail($creditId);
try {
    if ($operation === 'update') {
        app(UpdateCreditAccount::class)($credit, $admin, ['current_balance' => '777.33', 'last_payment_date' => '2026-10-31']);
        echo 'RESULT updated'.PHP_EOL;
    } elseif ($operation === 'archive') {
        app(ArchiveCreditAccount::class)($credit, $admin);
        echo 'RESULT archived'.PHP_EOL;
    } elseif ($operation === 'import') {
        $app->instance(ReadsSpreadsheetRows::class, new class implements ReadsSpreadsheetRows
        {
            public function read(string $path): array
            {
                return [[
                    '__row' => '2', 'documento' => '123456789', 'nombre_completo' => 'Synthetic Concurrent Credit',
                    'linea_credito' => 'FONALIBRE', 'numero_pagare' => 'CONCURRENT-CREDIT',
                    'valor_inicial' => '1000.00', 'valor_cuota' => '100.00', 'saldo_actual' => '555.55',
                    'fecha_ultimo_pago' => '2026-10-31', 'plazo' => '12', 'tasa_int_na' => '18', 'tasa_int_mv' => '1.5',
                ]];
            }
        });
        $app->instance(StoresPrivateFiles::class, new class implements StoresPrivateFiles
        {
            public function put(string $key, string $contents): void {}
        });
        $batch = app(ImportCreditAccounts::class)(new UploadedSpreadsheet('synthetic', 'concurrent-credit-import', 'synthetic.xlsx', 'xlsx', 'application/zip', 10), $admin);
        echo 'IMPORT_REJECTED='.$batch->rows_rejected.' CREATED='.$batch->rows_created.' UPDATED='.$batch->rows_updated.PHP_EOL;
    } else {
        throw new RuntimeException('Invalid test operation.');
    }
} catch (CannotManageCreditAccount $exception) {
    if ($exception->getMessage() !== CannotManageCreditAccount::archivedCreditCannotBeUpdated()->getMessage()) {
        fwrite(STDERR, 'WORKER_ERROR: '.$exception::class.PHP_EOL);
        exit(1);
    }
    echo 'RESULT rejected_archived'.PHP_EOL;
} catch (Throwable $exception) {
    fwrite(STDERR, 'WORKER_ERROR: '.$exception::class.PHP_EOL);
    exit(1);
}
