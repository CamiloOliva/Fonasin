<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityHeadersTest extends TestCase
{
    public function test_security_headers_are_returned_on_web_responses(): void
    {
        config([
            'security.headers.csp.enabled' => true,
            'security.headers.csp.policy' => "default-src 'self'; frame-ancestors 'none'",
        ]);

        $this->get('/')
            ->assertOk()
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");
    }

    public function test_content_security_policy_can_stay_disabled_for_local_development(): void
    {
        config(['security.headers.csp.enabled' => false]);

        $this->get('/')
            ->assertOk()
            ->assertHeaderMissing('Content-Security-Policy');
    }
}
