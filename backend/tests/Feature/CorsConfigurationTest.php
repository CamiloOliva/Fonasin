<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_approved_frontend_origin_receives_credentialed_cors_headers(): void
    {
        $this->withHeader('Origin', 'http://localhost:5173')
            ->get('/csrf-token')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_unapproved_origin_does_not_receive_cors_headers(): void
    {
        $this->withHeader('Origin', 'https://untrusted.example')
            ->get('/csrf-token')
            ->assertOk()
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
