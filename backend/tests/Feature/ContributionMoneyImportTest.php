<?php

namespace Tests\Feature;

use App\Application\Security\Contracts\HashesSensitiveData;
use App\Application\Storage\Contracts\StoresPrivateFiles;
use App\Models\Associate;
use App\Models\ContributionAccount;
use App\Models\ContributionMovement;
use App\Models\ImportBatch;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Shuchkin\SimpleXLSXGen;
use Tests\TestCase;

class ContributionMoneyImportTest extends TestCase
{
    use RefreshDatabase;

    private function prepareImport(): void
    {
        $this->app->instance(StoresPrivateFiles::class, new class implements StoresPrivateFiles
        {
            public function put(string $storageKey, string $contents): void {}
        });
        $admin = User::factory()->create(['status' => 'active']);
        $admin->roles()->attach(Role::query()->firstOrCreate(['name' => 'admin']));
        Associate::query()->create([
            'document_type' => 'CC',
            'document_number_hash' => app(HashesSensitiveData::class)->documentNumber('123456789'),
            'document_number_encrypted' => 'synthetic-test-only',
            'full_name' => 'Synthetic Money Associate',
            'status' => 'active',
        ]);
        $this->actingAs($admin);
    }

    private function import(string $type, string $amount, string $balance): mixed
    {
        $path = tempnam(sys_get_temp_dir(), 'fonasin-money-');
        SimpleXLSXGen::fromArray([
            ['documento', 'nombre_completo', 'valor_mensual', 'saldo', 'fecha_ultimo_pago'],
            ['123456789', 'Synthetic Money Associate', $amount, $balance, '2026-09-30'],
        ])->saveAs($path);
        try {
            return $this->postJson('/admin/import-batches/'.$type, [
                'file' => new UploadedFile($path, $type.'.xlsx', null, null, true),
            ]);
        } finally {
            @unlink($path);
        }
    }

    public function test_colombian_and_us_thousands_reach_the_exact_separate_balances(): void
    {
        $this->prepareImport();
        $this->import('contributions', '1.000', '1.000.000')->assertCreated()->assertJsonPath('data.status', 'completed');
        $this->import('permanent-savings', '1,000', '1,000,000')->assertCreated()->assertJsonPath('data.status', 'completed');
        $this->assertSame('1000000.00', ContributionAccount::query()->firstOrFail()->contribution_balance);
        $this->assertSame('1000000.00', ContributionAccount::query()->firstOrFail()->permanent_savings_balance);
        $this->assertSame('2000000.00', ContributionAccount::query()->firstOrFail()->total_balance);
    }

    public function test_a_value_above_decimal_capacity_is_rejected_before_persistence(): void
    {
        $this->prepareImport();
        $this->import('contributions', '1', '1000000000000')->assertCreated()
            ->assertJsonPath('data.status', 'completed_with_errors')->assertJsonPath('data.rows_rejected', 1);
        $this->assertSame(0, ContributionMovement::query()->count());
        $this->assertSame(0, ImportBatch::query()->where('status', 'processing')->count());
    }

    public function test_total_overflow_rolls_back_the_entire_new_batch_and_marks_it_failed(): void
    {
        $this->prepareImport();
        $this->import('contributions', '1', '999999999999.99')->assertCreated()->assertJsonPath('data.status', 'completed');
        $this->import('permanent-savings', '0.01', '0.01')->assertCreated()->assertJsonPath('data.status', 'failed');
        $account = ContributionAccount::query()->firstOrFail();
        $this->assertSame('999999999999.99', $account->total_balance);
        $this->assertSame('0.00', $account->permanent_savings_balance);
        $this->assertSame(1, ContributionMovement::query()->count());
        $this->assertSame(0, ImportBatch::query()->where('status', 'processing')->count());
        $this->assertDatabaseHas('audit_events', ['metadata->status' => 'failed']);
    }
}
