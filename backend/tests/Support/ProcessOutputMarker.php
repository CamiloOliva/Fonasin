<?php

namespace Tests\Support;

use Symfony\Component\Process\Process;

final class ProcessOutputMarker
{
    private string $output = '';

    public function __construct(private readonly string $marker) {}

    public function waitFor(Process $process): bool
    {
        // waitUntil() can collect output in its initial updateStatus() before
        // installing the callback. Inspect the complete stdout buffer instead.
        while (true) {
            if (str_contains($process->getOutput(), $this->marker)) {
                return true;
            }
            $running = $process->isRunning();
            $process->checkTimeout();
            if (! $running) {
                return str_contains($process->getOutput(), $this->marker);
            }
            usleep(10_000);
        }
    }

    public function __invoke(string $type, string $chunk): bool
    {
        if ($type === Process::OUT) {
            $this->output .= $chunk;
        }

        return str_contains($this->output, $this->marker);
    }
}
