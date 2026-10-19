<?php

// Synthetic local fixtures only. Never point this script at a hosted database.
use App\Application\Affiliation\UseCases\AcceptApplicationConsent;
use App\Application\Affiliation\UseCases\CreateAffiliationDraft;
use App\Application\Affiliation\UseCases\RegisterApplicationDocument;
use App\Application\Affiliation\UseCases\RequestAffiliationCorrection;
use App\Application\Affiliation\UseCases\SaveApplicationSection;
use App\Application\Affiliation\UseCases\StartAffiliationReview;
use App\Application\Affiliation\UseCases\SubmitAffiliationApplication;
use App\Application\Portal\UseCases\StartAssociateAffiliationUpdate;
use App\Application\Security\Contracts\EncryptsSensitiveData;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Affiliation\Enums\AffiliationApplicationPurpose;
use App\Domain\Affiliation\Enums\AffiliationApplicationStep;
use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use App\Domain\Affiliation\Enums\ConsentType;
use App\Mail\AffiliationCorrectionMail;
use App\Models\AffiliationApplication;
use App\Models\ApplicationSection;
use App\Models\Associate;
use App\Models\Role;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Shuchkin\SimpleXLSXGen;
use Tests\Support\AffiliationSectionPayloads;

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

SimpleXLSXGen::fromArray([
    ['documento', 'nombre_completo', 'linea_credito', 'numero_pagare', 'valor_inicial', 'valor_cuota', 'saldo_actual', 'fecha_ultimo_pago', 'Plazo', 'Tasa Int NA', 'Tasa Int mv'],
    [$fixture['document'], 'Synthetic E2E associate', 'FONALIBRE', 'E2E-'.$run, 1000000, 50000, 800000, '2026-09-30', 24, '18%', '1.5%'],
])->saveAs("{$directory}/credits.xlsx");
file_put_contents("{$directory}/logo.png", base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9l8AAAAASUVORK5CYII='));
file_put_contents("{$directory}/public-report.pdf", Pdf::loadHTML('<h1>Informe sintetico de prueba</h1>')->output());

// A real returned initial application, with the email captured locally only.
Mail::fake();
$payloads = new class
{
    use AffiliationSectionPayloads;

    public function payload(AffiliationApplicationStep $step): array
    {
        $data = $this->validSectionPayload($step);

        return match ($step) {
            AffiliationApplicationStep::Personal => [...$data, 'maritalStatus' => 'Soltero/a', 'department' => 'Santander', 'city' => 'Bucaramanga'],
            AffiliationApplicationStep::Employment => [...$data, 'workCity' => 'Bucaramanga - Santander'],
            AffiliationApplicationStep::Financial => [...$data, 'incomeBand' => '$2 a $5 millones'],
            AffiliationApplicationStep::Beneficiaries => [...$data, 'beneficiaries' => [[...$data['beneficiaries'][0], 'relationship' => 'Hermano/a']]],
            AffiliationApplicationStep::Sarlaft => [...$data, 'economicActivity' => '0010', 'resourceOrigin' => ['Salario']],
            default => $data,
        };
    }
};
// Separate synthetic accounts exercise both profile-only purposes without
// replacing a real affiliation or creating operational savings requests.
foreach (['profile_completion', 'data_update'] as $purpose) {
    $email = "{$purpose}-{$run}@example.test";
    $user = User::query()->create(['email' => $email, 'password' => $password, 'status' => 'active', 'must_change_password' => false]);
    $user->roles()->attach(Role::query()->firstOrCreate(['name' => 'associate']));
    $document = '901'.random_int(1000000, 9999999);
    $associate = Associate::query()->create([
        'user_id' => $user->id, 'document_type' => 'CC',
        'document_number_hash' => app(HashesSensitiveData::class)->documentNumber($document),
        'document_number_encrypted' => app(EncryptsSensitiveData::class)->encryptArray(['document_number' => $document]),
        'full_name' => 'Synthetic profile '.$purpose, 'status' => 'active',
    ]);
    if ($purpose === 'data_update') {
        $associate->affiliationApplications()->create(['purpose' => 'initial_affiliation', 'status' => 'enabled', 'current_step' => 'summary']);
    }
    $profileDraft = app(StartAssociateAffiliationUpdate::class)($user);
    foreach (AffiliationApplicationStep::formSections() as $step) {
        $data = $payloads->payload($step);
        if ($step === AffiliationApplicationStep::Personal) {
            $data = [...$data, 'documentNumber' => $document, 'email' => $email];
        } elseif ($step === AffiliationApplicationStep::Employment) {
            $data['monthlySalary'] = '10000000000';
        } elseif ($step === AffiliationApplicationStep::Financial) {
            foreach (['principalIncome', 'otherIncome', 'monthlyExpenses', 'financialObligations'] as $field) {
                $data[$field] = '10000000000';
            }
            $data['totalIncome'] = $data['totalExpenses'] = '20000000000';
        }
        app(SaveApplicationSection::class)($profileDraft, $step, 1, $data, now());
    }
    $fixture[$purpose] = ['email' => $email, 'application' => $profileDraft->id];
}
$correctionApplication = app(CreateAffiliationDraft::class)();
foreach (AffiliationApplicationStep::formSections() as $step) {
    app(SaveApplicationSection::class)($correctionApplication, $step, 1, $payloads->payload($step), now());
}
foreach (ApplicationDocumentType::requiredForSubmission() as $type) {
    app(RegisterApplicationDocument::class)(
        $correctionApplication, $type, $type->value.'.pdf', 'application/pdf', 20,
        fileContents: '%PDF-1.4 synthetic',
    );
}
foreach (ConsentType::requiredForSubmission() as $type) {
    app(AcceptApplicationConsent::class)($correctionApplication, $type, 'e2e-v1');
}
app(SubmitAffiliationApplication::class)($correctionApplication, 'e2e-v1');
$adminActor = User::query()->where('email', $fixture['admin'])->firstOrFail();
app(StartAffiliationReview::class)($correctionApplication, $adminActor);
app(RequestAffiliationCorrection::class)($correctionApplication, $adminActor, 'Revisa la direccion de residencia antes de reenviar.');
$fixture['correction_url'] = Mail::sent(AffiliationCorrectionMail::class)->last()->correctionUrl;
$fixture['correction_application'] = $correctionApplication->id;
foreach (['recovery' => 0, 'expired_recovery' => 1440] as $name => $ageMinutes) {
    $email = "{$name}-{$run}@example.test";
    $user = User::query()->create(['email' => $email, 'password' => $password, 'status' => 'active', 'must_change_password' => false]);
    $user->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin']));
    $token = bin2hex(random_bytes(32));
    DB::table('password_reset_tokens')->insert([
        'email' => $email, 'token' => Hash::make($token), 'created_at' => now()->subMinutes($ageMinutes),
    ]);
    $fixture[$name] = ['email' => $email, 'token' => $token];
}
file_put_contents("{$directory}/fixture.json", json_encode($fixture, JSON_THROW_ON_ERROR));
echo "Synthetic local fixtures ready; credentials stay in ignored .e2e-artifacts.\n";
