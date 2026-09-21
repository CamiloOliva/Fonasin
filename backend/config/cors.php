<?php

/**
 * Cross-origin policy for the public React application.
 *
 * Production serves React from https://fonasin.com and Laravel from
 * https://api.fonasin.com. Keep this allow-list explicit: credentials must
 * never be combined with a wildcard origin.
 */
return [
    'paths' => [
        'auth/*',
        'login',
        'logout',
        'password/*',
        'csrf-token',
        'affiliation-applications',
        'affiliation-applications/*',
        'portal/*',
        'admin/*',
        'fpqrs-submissions',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Content-Type', 'Origin', 'X-CSRF-TOKEN', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
