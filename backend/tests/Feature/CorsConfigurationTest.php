<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsConfigurationTest extends TestCase
{
    public function test_approved_frontend_origin_receives_credentialed_cors_headers(): void
    {
        config([
            'cors.allowed_origins' => ['https://fonasin.com'],
            'cors.supports_credentials' => true,
        ]);

        $this->withHeader('Origin', 'https://fonasin.com')
            ->get('/csrf-token')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'https://fonasin.com')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
    }

    public function test_unapproved_origin_does_not_receive_cors_headers(): void
    {
        config(['cors.allowed_origins' => ['https://fonasin.com']]);

        $this->withHeader('Origin', 'https://untrusted.example')
            ->get('/csrf-token')
            ->assertOk()
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
