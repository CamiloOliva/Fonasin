<?php

// Synthetic local fixtures only. Never point this script at a hosted database.
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationPurpose;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Shuchkin\SimpleXLSXGen;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('local') || config('database.default') !== 'mariadb'
    || config('database.connections.mariadb.database') !== 'fonasin_e2e'
    || ! in_array(config('database.connections.mariadb.host'), ['127.0.0.1', 'localhost'], true)) {
    throw new RuntimeException('Fixtures require APP_ENV=local and local MariaDB database fonasin_e2e.');
}
$run = bin2hex(random_bytes(5));
$password = 'LocalE2E-'.bin2hex(random_bytes(12));
$fixture = ['password' => $password, 'run' => $run];
foreach (['admin', 'associate', 'other', 'reviewer'] as $actor) {
    $email = "{$actor}-{$run}@example.test";
    $user = User::query()->create(['email' => $email, 'password' => $password, 'status' => 'active', 'must_change_password' => false]);
    $role = Role::query()->firstOrCreate(['name' => $actor === 'other' ? 'associate' : $actor]);
    $user->roles()->attach($role);
    $fixture[$actor] = $email;
    if (in_array($actor, ['associate', 'other'], true)) {
        $document = '900'.random_int(1000000, 9999999);
        $associate = Associate::query()->create([
            'user_id' => $user->id, 'document_type' => 'CC',
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber($document),
            'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => $document]),
            'full_name' => "Synthetic E2E {$actor}", 'status' => 'active',
        ]);
        $application = AffiliationApplication::query()->create([
            'associate_id' => $associate->id,
            'status' => 'enabled',
            'purpose' => AffiliationApplicationPurpose::InitialAffiliation->value,
            'submitted_at' => now()->subDay(),
        ]);
        foreach ([
            AffiliationApplicationStep::Personal->value => [
                'issuePlace' => 'Bucaramanga',
                'mobile' => '3000000000',
                'email' => $email,
            ],
            AffiliationApplicationStep::Employment->value => [
                'employer' => 'Empresa de prueba',
                'monthlySalary' => 2500000,
            ],
        ] as $section => $data) {
            ApplicationSection::query()->forceCreate([
                'application_id' => $application->id,
                'section' => $section,
                'schema_version' => 1,
                'data_encrypted' => app(EncryptsSensitiveData::class)->encryptArray($data),
                'completed_at' => now(),
            ]);
        }
        if ($actor === 'associate') {
            $fixture['document'] = $document;
        }
    }
}
$directory = dirname(__DIR__, 3).'/.e2e-artifacts';
if (! is_dir($directory) && ! mkdir($directory, 0700, true)) {
    throw new RuntimeException('Cannot create local artifacts.');
}
foreach (['contributions' => 400000, 'permanent-savings' => 300000, 'voluntary-savings' => 150000] as $type => $balance) {
    SimpleXLSXGen::fromArray([
        ['documento', 'nombre_completo', 'valor_mensual', 'saldo', 'fecha_ultimo_pago'],
        [$fixture['document'], 'Synthetic E2E associate', 10000, $balance, '2026-09-30'],
    ])->saveAs("{$directory}/{$type}.xlsx");
}
file_put_contents("{$directory}/fixture.json", json_encode($fixture, JSON_THROW_ON_ERROR));
echo "Synthetic local fixtures ready; credentials stay in ignored .e2e-artifacts.\n";
