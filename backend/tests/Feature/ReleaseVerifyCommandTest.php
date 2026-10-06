<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReleaseVerifyCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_passes_when_every_versioned_migration_has_run(): void
    {
        $this->assertSame(0, Artisan::call('release:verify'));
    }

    public function test_blocks_frontend_publication_when_a_migration_is_pending(): void
    {
        $migration = DB::table('migrations')->orderByDesc('migration')->value('migration');
        $this->assertNotNull($migration);
        DB::table('migrations')->where('migration', $migration)->delete();

        $this->assertSame(1, Artisan::call('release:verify'));
        $this->assertStringContainsString('pendiente', Artisan::output());
    }
}
