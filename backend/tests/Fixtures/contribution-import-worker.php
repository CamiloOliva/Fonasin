<?php

use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Imports\DTO\UploadedSpreadsheet;
use App\Application\Imports\Exceptions\CannotImportSpreadsheet;
use App\Application\Imports\UseCases\ImportContributionMovements;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Domain\Contributions\Enums\ContributionMovementType;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! app()->environment('testing') || DB::getDriverName() !== 'mariadb' || DB::connection()->getDatabaseName() !== 'fonasin_test') {
    throw new RuntimeException('This worker requires the isolated MariaDB testing environment.');
}
$amount = $argv[2];
$delay = (int) $argv[3];
$releaseFile = $argv[4] ?? null;
$storageLog = $argv[5] ?? null;
$app->instance(ReadsSpreadsheetRows::class, new class($amount) implements ReadsSpreadsheetRows
{
    public function __construct(private string $amount) {}

    public function read(string $path): array
    {
        return [[
            '__row' => '2', 'documento' => '123456789', 'nombre_completo' => 'Synthetic Concurrent Associate',
            'valor_mensual' => '1.00', 'saldo' => $this->amount, 'fecha_ultimo_pago' => '2026-09-30',
        ]];
    }
});
$app->instance(StoresPrivateFiles::class, new class($storageLog) implements StoresPrivateFiles
{
    public function __construct(private ?string $storageLog) {}

    public function put(string $storageKey, string $contents): void
    {
        if ($this->storageLog !== null) {
            file_put_contents($this->storageLog, $storageKey.PHP_EOL, FILE_APPEND | LOCK_EX);
        }
    }
});
DB::listen(function ($query) use ($delay, $releaseFile): void {
    if ($releaseFile !== null && str_contains($query->sql, 'import_batches') && str_contains($query->sql, 'exists')) {
        echo 'CHECKED'.PHP_EOL;
        flush();
        while (! is_file($releaseFile)) {
            usleep(10_000);
        }
    }
    if (str_contains($query->sql, 'from `associates`') && str_contains($query->sql, 'for update')) {
        echo 'LOCKED '.$query->time.PHP_EOL;
        flush();
        if ($delay > 0) {
            usleep($delay * 1000);
        }
    }
});
try {
    $batch = app(ImportContributionMovements::class)(
        new UploadedSpreadsheet('synthetic', 'concurrent-'.$amount, 'synthetic.xlsx', 'xlsx', 'application/zip', 10),
        User::query()->findOrFail($argv[1]), ContributionMovementType::Contribution, 'contributions',
    );
    echo 'RESULT '.$batch->status.PHP_EOL;
} catch (CannotImportSpreadsheet $exception) {
    if ($exception->getMessage() !== CannotImportSpreadsheet::duplicateFile()->getMessage()) {
        throw $exception;
    }
    echo 'DUPLICATE '.$exception->getMessage().PHP_EOL;
}
