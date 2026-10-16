<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Yaml\Yaml;

class DependencySecurityGateTest extends TestCase
{
    private function auditCommand(string $job, string $tool): string
    {
        $workflow = Yaml::parseFile(dirname(__DIR__, 3).'/.github/workflows/quality-gates.yml');
        $commands = array_values(array_filter(array_column($workflow['jobs'][$job]['steps'], 'run'),
            fn (string $command): bool => str_starts_with($command, $tool.' audit')));
        $this->assertCount(1, $commands, 'The quality gate must audit its dependency graph.');

        return $commands[0];
    }

    public function test_php_gate_audits_production_and_development_without_ignoring_advisories(): void
    {
        $this->assertSame('composer audit --format=summary', $this->auditCommand('backend', 'composer'));
    }

    public function test_frontend_gate_includes_development_and_blocks_every_severity(): void
    {
        $this->assertSame('npm audit --audit-level=low', $this->auditCommand('frontend', 'npm'));
    }
}
