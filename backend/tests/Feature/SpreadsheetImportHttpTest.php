<?php

namespace Tests\Feature;

use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Contributions\Enums\ContributionMovementType;
use App\Domain\Credits\Enums\CreditAccountStatus;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\Associate;
use App\Models\AuditEvent;
use App\Models\ContributionAccount;
use App\Models\CreditAccount;
use App\Models\ImportBatch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Shuchkin\SimpleXLSXGen;
use Tests\TestCase;

class SpreadsheetImportHttpTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_import_credit_accounts_from_xlsx(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $file = $this->xlsx('creditos.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '1.250.000,50', '1.000.000,25', '24', '1,2500', '52.000,75', 'active'],
        ]);

        $response = $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $file,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.import_type', 'credits')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.rows_created', 1)
            ->assertJsonMissingPath('data.storage_key')
            ->assertJsonMissingPath('data.file_hash');

        $this->assertDatabaseHas('credit_accounts', [
            'associate_id' => $associate->id,
            'credit_line' => 'FONALIBRE',
            'current_balance' => '1000000.25',
            'status' => CreditAccountStatus::Active->value,
        ]);

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Credits->value,
            'action' => 'credit.registered',
            'actor_user_id' => $admin->id,
        ]);
        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Imports->value,
            'action' => ImportAuditAction::ImportCompleted->value,
            'actor_user_id' => $admin->id,
            'metadata->type' => 'credits',
        ]);
        Storage::disk('local')->assertExists($this->storedImportPath());
    }

    public function test_credit_import_updates_existing_credit_and_reports_rejected_rows(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');
        CreditAccount::query()->create([
            'associate_id' => $associate->id,
            'credit_line' => 'FONALIBRE',
            'initial_balance' => '900000.00',
            'current_balance' => '800000.00',
            'term_months' => 12,
            'interest_rate' => '1.0000',
            'installment_amount' => '80000.00',
            'status' => CreditAccountStatus::Active->value,
            'registered_by_user_id' => $admin->id,
        ]);

        $file = $this->xlsx('creditos-parcial.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '900000.00', '750000.00', '12', '1.0000', '80000.00', 'active'],
            ['000000000', 'FONALIBRE', '100000.00', '90000.00', '6', '1.0000', '15000.00', 'active'],
        ]);

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.status', 'completed_with_errors')
            ->assertJsonPath('data.rows_updated', 1)
            ->assertJsonPath('data.rows_rejected', 1);

        $this->assertDatabaseHas('credit_accounts', [
            'associate_id' => $associate->id,
            'credit_line' => 'FONALIBRE',
            'current_balance' => '750000.00',
        ]);

        $event = AuditEvent::query()
            ->where('subject_type', 'credit_account')
            ->where('action', 'credit.updated')
            ->firstOrFail();

        $this->assertSame(['current_balance'], $event->metadata['changed_fields']);
        $this->assertArrayNotHasKey('previous_values', $event->metadata);
        $this->assertArrayNotHasKey('new_values', $event->metadata);
    }

    public function test_admin_can_import_contribution_movements_from_xlsx(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $file = $this->xlsx('aportes.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '100.000,00', '400.000,00', 'registered', 'AP-001'],
            ['123456789', '2026-09-01', '2026-09-30', 'voluntary_savings', '50.000,00', '150.000,00', 'registered', 'AV-001'],
        ]);

        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.import_type', 'contributions')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.rows_created', 2);

        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '400000.00',
            'voluntary_savings_balance' => '150000.00',
            'total_balance' => '550000.00',
        ]);
        $this->assertDatabaseHas('contribution_movements', [
            'associate_id' => $associate->id,
            'movement_type' => ContributionMovementType::PermanentSavings->value,
            'reference' => 'AP-001',
            'status' => ContributionMovementStatus::Registered->value,
        ]);
    }

    public function test_contribution_balance_uses_latest_period_when_rows_are_unordered(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $file = $this->xlsx('aportes-desordenados.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '100000.00', '300000.00', 'registered', 'AP-SEP'],
            ['123456789', '2026-08-01', '2026-08-31', 'permanent_savings', '100000.00', '200000.00', 'registered', 'AP-AUG'],
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/import-batches/contributions', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '300000.00',
            'total_balance' => '300000.00',
        ]);
        $this->assertSame(
            '2026-09-01',
            ContributionAccount::query()->where('associate_id', $associate->id)->firstOrFail()->last_period->toDateString(),
        );
    }

    public function test_contribution_import_reverses_previous_movement_when_same_reference_is_corrected(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');
        $account = ContributionAccount::query()->create([
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '100000.00',
            'voluntary_savings_balance' => '0.00',
            'total_balance' => '100000.00',
            'status' => 'active',
        ]);
        $account->movements()->create([
            'associate_id' => $associate->id,
            'recorded_by_user_id' => $admin->id,
            'movement_type' => ContributionMovementType::PermanentSavings->value,
            'period' => '2026-09-01',
            'cut_off_date' => '2026-09-30',
            'amount' => '100000.00',
            'balance_after' => '100000.00',
            'status' => ContributionMovementStatus::Registered->value,
            'source' => 'xlsx',
            'reference' => 'AP-001',
            'source_row_hash' => hash('sha256', 'old-row'),
            'recorded_at' => now(),
        ]);

        $file = $this->xlsx('aportes-correccion.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '120000.00', '120000.00', 'registered', 'AP-001'],
        ]);

        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.rows_created', 1);

        $this->assertDatabaseHas('contribution_movements', [
            'reference' => 'AP-001',
            'amount' => '100000.00',
            'status' => ContributionMovementStatus::Reversed->value,
        ]);
        $this->assertDatabaseHas('contribution_movements', [
            'reference' => 'AP-001',
            'amount' => '120000.00',
            'status' => ContributionMovementStatus::Registered->value,
        ]);
        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '120000.00',
            'total_balance' => '120000.00',
        ]);
    }

    public function test_correcting_an_older_period_does_not_replace_the_latest_account_balance(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');
        $account = ContributionAccount::query()->create([
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '300000.00',
            'voluntary_savings_balance' => '0.00',
            'total_balance' => '300000.00',
            'status' => 'active',
        ]);

        foreach ([
            ['2026-08-01', '2026-08-31', '200000.00', 'AP-AUG'],
            ['2026-09-01', '2026-09-30', '300000.00', 'AP-SEP'],
        ] as [$period, $cutOffDate, $balance, $reference]) {
            $account->movements()->create([
                'associate_id' => $associate->id,
                'recorded_by_user_id' => $admin->id,
                'movement_type' => ContributionMovementType::PermanentSavings->value,
                'period' => $period,
                'cut_off_date' => $cutOffDate,
                'amount' => '100000.00',
                'balance_after' => $balance,
                'status' => ContributionMovementStatus::Registered->value,
                'source' => 'xlsx',
                'reference' => $reference,
                'source_row_hash' => hash('sha256', $reference),
                'recorded_at' => now(),
            ]);
        }

        $file = $this->xlsx('correccion-agosto.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-08-01', '2026-08-31', 'permanent_savings', '110000.00', '210000.00', 'registered', 'AP-AUG'],
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/import-batches/contributions', ['file' => $file])
            ->assertCreated();

        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'permanent_savings_balance' => '300000.00',
            'total_balance' => '300000.00',
        ]);
    }

    public function test_contribution_import_rejects_rows_without_reference(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $this->createAssociate('123456789');

        $file = $this->xlsx('aporte-sin-referencia.xlsx', [
            ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
            ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '100000.00', '300000.00', 'registered', ''],
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/import-batches/contributions', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.status', 'completed_with_errors')
            ->assertJsonPath('data.rows_rejected', 1)
            ->assertJsonPath('data.errors.0.message', 'La referencia es obligatoria.');

        $this->assertDatabaseCount('contribution_movements', 0);
    }

    public function test_import_rejects_files_above_the_configured_row_limit(): void
    {
        Storage::fake('local');
        config(['imports.max_rows' => 1]);
        $admin = $this->userWithRole('admin');

        $file = $this->xlsx('demasiadas-filas.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '100000.00', '90000.00', '12', '1.0000', '10000.00', 'active'],
            ['987654321', 'FONAPEN', '200000.00', '180000.00', '12', '1.0000', '20000.00', 'active'],
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/import-batches/credits', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.errors.0.message', 'El archivo supera el limite de 1 filas.');

        $this->assertDatabaseCount('credit_accounts', 0);
    }

    public function test_import_timeout_rolls_back_rows_and_keeps_failed_batch_history(): void
    {
        Storage::fake('local');
        config(['imports.max_processing_seconds' => 1]);
        $admin = $this->userWithRole('admin');
        $this->createAssociate('123456789');

        $this->app->instance(ReadsSpreadsheetRows::class, new class implements ReadsSpreadsheetRows
        {
            public function read(string $path): array
            {
                usleep(1_100_000);

                return [[
                    '__row' => '2',
                    'documento' => '123456789',
                    'linea_credito' => 'FONALIBRE',
                    'valor_inicial' => '100000.00',
                    'saldo_actual' => '90000.00',
                    'plazo_meses' => '12',
                    'tasa_interes' => '1.0000',
                    'valor_cuota' => '10000.00',
                    'estado' => 'active',
                ]];
            }
        });

        $file = $this->xlsx('importacion-lenta.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '100000.00', '90000.00', '12', '1.0000', '10000.00', 'active'],
        ]);

        $this->actingAs($admin)
            ->postJson('/admin/import-batches/credits', ['file' => $file])
            ->assertCreated()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.errors.0.message', 'La importacion supero el limite de tiempo configurado.');

        $this->assertDatabaseCount('credit_accounts', 0);
        $this->assertDatabaseHas('import_batches', [
            'import_type' => 'credits',
            'status' => 'failed',
        ]);
    }

    public function test_repeated_import_file_is_rejected_without_exposing_private_hashes(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $this->createAssociate('123456789');
        $file = $this->xlsx('creditos.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '1250000.50', '1000000.25', '24', '1.2500', '52000.75', 'active'],
        ]);

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', ['file' => $file])->assertCreated();

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('creditos.xlsx', [
                ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
                ['123456789', 'FONALIBRE', '1250000.50', '1000000.25', '24', '1.2500', '52000.75', 'active'],
            ]),
        ])->assertUnprocessable()
            ->assertJsonPath('message', 'Este archivo ya fue importado para este tipo de carga.');

        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Imports->value,
            'action' => ImportAuditAction::ImportRejected->value,
            'actor_user_id' => $admin->id,
            'metadata->reason' => 'duplicate_file',
        ]);
    }

    public function test_invalid_spreadsheet_columns_are_reported_in_import_history(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('creditos-invalidos.xlsx', [
                ['documento', 'linea_credito'],
                ['123456789', 'FONALIBRE'],
            ]),
        ])->assertCreated()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.rows_created', 0)
            ->assertJsonPath('data.errors.0.row', null);

        $this->assertDatabaseHas('import_batches', [
            'import_type' => 'credits',
            'status' => 'failed',
        ]);
    }

    public function test_reviewer_and_associate_cannot_import_spreadsheets(): void
    {
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');
        $associate = $this->userWithRole('associate', 'associate@example.test');
        $file = $this->xlsx('creditos.xlsx', [
            ['documento', 'linea_credito', 'valor_inicial', 'saldo_actual', 'plazo_meses', 'tasa_interes', 'valor_cuota', 'estado'],
            ['123456789', 'FONALIBRE', '1250000.50', '1000000.25', '24', '1.2500', '52000.75', 'active'],
        ]);

        $this->actingAs($reviewer)
            ->postJson('/admin/import-batches/credits', ['file' => $file])
            ->assertForbidden();
        $this->actingAs($associate)
            ->postJson('/admin/import-batches/contributions', [
                'file' => $this->xlsx('aportes.xlsx', [
                    ['documento', 'periodo', 'fecha_corte', 'tipo_aporte', 'valor', 'saldo_despues', 'estado', 'referencia'],
                    ['123456789', '2026-09-01', '2026-09-30', 'permanent_savings', '100000.00', '400000.00', 'registered', 'AP-001'],
                ]),
            ])
            ->assertForbidden();
    }

    public function test_admin_can_download_import_templates(): void
    {
        $admin = $this->userWithRole('admin');

        $credits = $this->actingAs($admin)
            ->get('/admin/import-batches/templates/credits')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $contributions = $this->actingAs($admin)
            ->get('/admin/import-batches/templates/contributions')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->assertStringContainsString('no-store', (string) $credits->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', (string) $contributions->headers->get('Cache-Control'));
    }

    public function test_reviewer_cannot_download_import_templates(): void
    {
        $reviewer = $this->userWithRole('reviewer', 'reviewer.template@example.test');

        $this->actingAs($reviewer)
            ->get('/admin/import-batches/templates/credits')
            ->assertForbidden();
    }

    /**
     * @param  array<int, array<int, string>>  $rows
     */
    private function xlsx(string $filename, array $rows): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'fonasin-xlsx-').'.xlsx';
        SimpleXLSXGen::fromArray($rows)->saveAs($path);

        return new UploadedFile(
            path: $path,
            originalName: $filename,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            error: null,
            test: true,
        );
    }

    private function createAssociate(string $documentNumber): Associate
    {
        $hasher = app(HashesSensitiveData::class);

        return Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => $hasher->documentNumber($documentNumber),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Associate',
            'status' => 'active',
        ]);
    }

    private function userWithRole(string $roleName, string $email = 'admin@example.test'): User
    {
        $user = User::factory()->create([
            'email' => $email,
            'status' => 'active',
        ]);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }

    private function storedImportPath(): string
    {
        $batch = ImportBatch::query()->firstOrFail();

        return $batch->getAttribute('storage_key');
    }
}
