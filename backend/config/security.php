<?php

return [
    'headers' => [
        'csp' => [
            'enabled' => (bool) env('SECURITY_CSP_ENABLED', false),
            'policy' => env(
                'SECURITY_CSP_POLICY',
                "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
            ),
        ],
    ],
];
