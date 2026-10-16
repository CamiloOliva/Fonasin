<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Symfony\Component\HttpFoundation\Request;

class HttpHeaderRegressionTest extends TestCase
{
    public function test_cache_control_with_whitespace_keeps_its_directives(): void
    {
        // CVE-2026-108082 made this input exhaust the regex backtracking limit
        // and silently discard Cache-Control. Assert behavior, not a timing bound.
        $request = Request::create('/', server: [
            'HTTP_CACHE_CONTROL' => 'max-age=60'.str_repeat(' ', 32).', public',
        ]);
        $this->assertSame('60', $request->headers->getCacheControlDirective('max-age'));
        $this->assertTrue($request->headers->hasCacheControlDirective('public'));
    }

    public function test_whitespace_separator_still_splits_tokens(): void
    {
        // Also guards the follow-up fix after the first security patch.
        $this->assertSame(['foo', 'bar'], HeaderUtils::split('foo bar', ' '));
    }
}
