<?php

return [
    'hashing' => [
        'pepper' => env('DATA_HASH_PEPPER') ?: env('APP_KEY'),
    ],

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
