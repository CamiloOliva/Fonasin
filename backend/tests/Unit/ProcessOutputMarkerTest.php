<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Process\Process;
use Tests\Support\ProcessOutputMarker;

class ProcessOutputMarkerTest extends TestCase
{
    public function test_every_marker_survives_every_stdout_chunk_boundary(): void
    {
        foreach (['CHECKED', 'WAITING', 'LOCKED'] as $marker) {
            for ($split = 1; $split < strlen($marker); $split++) {
                $seen = new ProcessOutputMarker($marker);
                $this->assertFalse($seen(Process::OUT, 'prefix '.substr($marker, 0, $split)));
                $this->assertTrue($seen(Process::OUT, substr($marker, $split).PHP_EOL));
                $this->assertTrue($seen(Process::OUT, 'suffix'));
            }
        }
    }

    public function test_stderr_cannot_impersonate_a_progress_marker(): void
    {
        $seen = new ProcessOutputMarker('LOCKED');
        $this->assertFalse($seen(Process::ERR, 'LOCKED'));
        $this->assertFalse($seen(Process::OUT, 'LOCK'));
        $this->assertFalse($seen(Process::ERR, 'ED'));
        $this->assertTrue($seen(Process::OUT, 'ED'));
    }

    public function test_unrelated_output_is_not_a_progress_signal(): void
    {
        $seen = new ProcessOutputMarker('WAITING');
        $this->assertFalse($seen(Process::OUT, 'RESULT completed'));
        $this->assertFalse($seen(Process::OUT, 'CHECKED'));
    }

    public function test_wait_reads_a_marker_already_buffered_before_the_wait_starts(): void
    {
        $process = new Process([PHP_BINARY, '-r', 'echo "READY";']);
        $process->start();
        $process->wait();
        $this->assertSame('READY', $process->getOutput());
        $this->assertTrue((new ProcessOutputMarker('READY'))->waitFor($process));
    }

    public function test_wait_collects_split_stdout_while_a_real_process_runs(): void
    {
        $process = new Process([PHP_BINARY, '-r', 'echo "REA"; flush(); usleep(50000); echo "DY";'], timeout: 5);
        try {
            $process->start();
            $this->assertTrue((new ProcessOutputMarker('READY'))->waitFor($process));
        } finally {
            $process->stop();
        }
    }

    public function test_wait_does_not_accept_a_marker_from_stderr_or_an_unrelated_exit(): void
    {
        foreach (['fwrite(STDERR, "READY");', 'echo "RESULT completed";'] as $code) {
            $process = new Process([PHP_BINARY, '-r', $code], timeout: 5);
            $process->start();
            $this->assertFalse((new ProcessOutputMarker('READY'))->waitFor($process));
            $this->assertSame(0, $process->getExitCode());
        }
    }
}
