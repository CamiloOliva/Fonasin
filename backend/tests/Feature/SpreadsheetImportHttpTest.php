<?php

namespace Tests\Feature;

use App\Application\Imports\Contracts\ReadsSpreadsheetRows;
use App\Application\Security\Contracts\HashesSensitiveData;
use App\Domain\Audit\Enums\AuditModule;
use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Imports\Enums\ImportAuditAction;
use App\Models\Associate;
use App\Models\ContributionMovement;
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

    public function test_admin_can_import_the_operational_credit_template(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $response = $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('cartera.xlsx', [$this->creditHeaders(), $this->creditRow()]),
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
            'initial_balance' => '1250000.50',
            'installment_amount' => '52000.75',
            'current_balance' => '1000000.25',
            'last_payment_date' => '2026-09-30 00:00:00',
        ]);
        $this->assertDatabaseHas('audit_events', [
            'module' => AuditModule::Imports->value,
            'action' => ImportAuditAction::ImportCompleted->value,
            'actor_user_id' => $admin->id,
            'metadata->type' => 'credits',
        ]);
        Storage::disk('local')->assertExists(ImportBatch::query()->firstOrFail()->storage_key);
    }

    public function test_credit_import_updates_by_promissory_note_and_rejects_unknown_associate(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('cartera-inicial.xlsx', [$this->creditHeaders(), $this->creditRow()]),
        ])->assertCreated();

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('cartera-actualizada.xlsx', [
                $this->creditHeaders(),
                $this->creditRow(['saldo_actual' => '900.000,00']),
                $this->creditRow(['documento' => '000000000', 'numero_pagare' => 'PAG-002']),
                $this->creditRow(['nombre_completo' => 'Otra persona', 'numero_pagare' => 'PAG-003']),
            ]),
        ])->assertCreated()
            ->assertJsonPath('data.status', 'completed_with_errors')
            ->assertJsonPath('data.rows_updated', 1)
            ->assertJsonPath('data.rows_rejected', 2);

        $this->assertDatabaseHas('credit_accounts', [
            'associate_id' => $associate->id,
            'current_balance' => '900000.00',
        ]);
    }

    public function test_each_contribution_template_updates_only_its_own_balance(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        foreach ([
            ['contributions', 'aportes.xlsx', '100000.00', '400000.00'],
            ['voluntary-savings', 'ahorro-voluntario.xlsx', '50000.00', '150000.00'],
            ['permanent-savings', 'ahorro-permanente.xlsx', '80000.00', '300000.00'],
        ] as [$route, $filename, $monthlyValue, $balance]) {
            $this->actingAs($admin)->postJson('/admin/import-batches/'.$route, [
                'file' => $this->xlsx($filename, [
                    $this->contributionHeaders(),
                    ['123456789', 'Synthetic Associate', $monthlyValue, $balance, '2026-09-30'],
                ]),
            ])->assertCreated()
                ->assertJsonPath('data.status', 'completed')
                ->assertJsonPath('data.rows_created', 1);
        }

        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'contribution_balance' => '400000.00',
            'voluntary_savings_balance' => '150000.00',
            'permanent_savings_balance' => '300000.00',
            'total_balance' => '850000.00',
        ]);
        $this->assertDatabaseCount('contribution_movements', 3);
    }

    public function test_latest_payment_date_determines_balance_when_rows_are_unordered(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $associate = $this->createAssociate('123456789');

        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', [
            'file' => $this->xlsx('aportes-desordenados.xlsx', [
                $this->contributionHeaders(),
                ['123456789', 'Synthetic Associate', '100000.00', '300000.00', '2026-09-30'],
                ['123456789', 'Synthetic Associate', '100000.00', '200000.00', '2026-08-31'],
            ]),
        ])->assertCreated()->assertJsonPath('data.status', 'completed');

        $this->assertDatabaseHas('contribution_accounts', [
            'associate_id' => $associate->id,
            'contribution_balance' => '300000.00',
            'total_balance' => '300000.00',
        ]);
    }

    public function test_corrected_period_reverses_the_previous_movement(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $this->createAssociate('123456789');

        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', [
            'file' => $this->xlsx('aporte-original.xlsx', [
                $this->contributionHeaders(),
                ['123456789', 'Synthetic Associate', '100000.00', '300000.00', '2026-09-30'],
            ]),
        ])->assertCreated();
        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', [
            'file' => $this->xlsx('aporte-corregido.xlsx', [
                $this->contributionHeaders(),
                ['123456789', 'Synthetic Associate', '120000.00', '320000.00', '2026-09-30'],
            ]),
        ])->assertCreated()->assertJsonPath('data.rows_created', 1);

        $this->assertSame(1, ContributionMovement::query()
            ->where('status', ContributionMovementStatus::Reversed->value)->count());
        $this->assertDatabaseHas('contribution_accounts', [
            'contribution_balance' => '320000.00',
            'total_balance' => '320000.00',
        ]);
    }

    public function test_import_limits_and_timeout_are_enforced(): void
    {
        Storage::fake('local');
        config(['imports.max_rows' => 1]);
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('demasiadas-filas.xlsx', [
                $this->creditHeaders(),
                $this->creditRow(),
                $this->creditRow(['documento' => '987654321', 'numero_pagare' => 'PAG-002']),
            ]),
        ])->assertCreated()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.errors.0.message', 'El archivo supera el limite de 1 filas.');

        config(['imports.max_rows' => 5000, 'imports.max_processing_seconds' => 1]);
        $this->createAssociate('123456789');
        $row = array_combine($this->creditHeaders(), $this->creditRow());
        $row['__row'] = '2';
        $this->app->instance(ReadsSpreadsheetRows::class, new class($row) implements ReadsSpreadsheetRows
        {
            public function __construct(private readonly array $row) {}

            public function read(string $path): array
            {
                usleep(1_100_000);

                return [$this->row];
            }
        });

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('importacion-lenta.xlsx', [$this->creditHeaders(), $this->creditRow()]),
        ])->assertCreated()
            ->assertJsonPath('data.status', 'failed')
            ->assertJsonPath('data.errors.0.message', 'La importacion supero el limite de tiempo configurado.');
    }

    public function test_repeated_file_is_rejected_per_import_type(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $this->createAssociate('123456789');
        $rows = [$this->contributionHeaders(), ['123456789', 'Synthetic Associate', '100000', '300000', '2026-09-30']];
        $file = $this->xlsx('movimientos.xlsx', $rows);
        $contents = file_get_contents($file->getRealPath());

        $this->assertIsString($contents);

        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', [
            'file' => $this->xlsxFromContents('movimientos.xlsx', $contents),
        ])->assertCreated();
        $this->actingAs($admin)->postJson('/admin/import-batches/contributions', [
            'file' => $this->xlsxFromContents('movimientos.xlsx', $contents),
        ])->assertUnprocessable();
        $this->actingAs($admin)->postJson('/admin/import-batches/voluntary-savings', [
            'file' => $this->xlsxFromContents('movimientos.xlsx', $contents),
        ])->assertCreated();
    }

    public function test_invalid_columns_are_reported_and_non_admins_are_forbidden(): void
    {
        Storage::fake('local');
        $admin = $this->userWithRole('admin');
        $reviewer = $this->userWithRole('reviewer', 'reviewer@example.test');

        $this->actingAs($admin)->postJson('/admin/import-batches/credits', [
            'file' => $this->xlsx('invalido.xlsx', [['documento'], ['123456789']]),
        ])->assertCreated()->assertJsonPath('data.status', 'failed');

        $this->actingAs($reviewer)->postJson('/admin/import-batches/permanent-savings', [
            'file' => $this->xlsx('ahorro.xlsx', [$this->contributionHeaders(), ['1', 'Nombre', '1', '1', '2026-09-30']]),
        ])->assertForbidden();
    }

    public function test_admin_can_download_all_operational_templates(): void
    {
        $admin = $this->userWithRole('admin');

        foreach (['credits', 'contributions', 'voluntary-savings', 'permanent-savings'] as $type) {
            $response = $this->actingAs($admin)
                ->get('/admin/import-batches/templates/'.$type)
                ->assertOk()
                ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        }
    }

    /** @return list<string> */
    private function creditHeaders(): array
    {
        return ['documento', 'nombre_completo', 'linea_credito', 'numero_pagare', 'valor_inicial', 'valor_cuota', 'saldo_actual', 'fecha_ultimo_pago'];
    }

    /** @param array<string, string> $overrides
     * @return list<string>
     */
    private function creditRow(array $overrides = []): array
    {
        return array_values([
            'documento' => '123456789',
            'nombre_completo' => 'Synthetic Associate',
            'linea_credito' => 'FONALIBRE',
            'numero_pagare' => 'PAG-001',
            'valor_inicial' => '1.250.000,50',
            'valor_cuota' => '52.000,75',
            'saldo_actual' => '1.000.000,25',
            'fecha_ultimo_pago' => '2026-09-30',
            ...$overrides,
        ]);
    }

    /** @return list<string> */
    private function contributionHeaders(): array
    {
        return ['documento', 'nombre_completo', 'valor_mensual', 'saldo', 'fecha_ultimo_pago'];
    }

    /** @param array<int, array<int, string>> $rows */
    private function xlsx(string $filename, array $rows): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'fonasin-xlsx-').'.xlsx';
        SimpleXLSXGen::fromArray($rows)->saveAs($path);

        return new UploadedFile($path, $filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    private function xlsxFromContents(string $filename, string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'fonasin-xlsx-copy-').'.xlsx';
        file_put_contents($path, $contents);

        return new UploadedFile($path, $filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }

    private function createAssociate(string $documentNumber): Associate
    {
        return Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber($documentNumber),
            'document_number_encrypted' => 'test-ciphertext',
            'full_name' => 'Synthetic Associate',
            'status' => 'active',
        ]);
    }

    private function userWithRole(string $roleName, string $email = 'admin@example.test'): User
    {
        $user = User::factory()->create(['email' => $email, 'status' => 'active']);
        $role = Role::query()->firstOrCreate(['name' => $roleName]);
        $user->roles()->attach($role);

        return $user;
    }
}
