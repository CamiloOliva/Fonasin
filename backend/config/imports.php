<?php

return [
    'max_file_kilobytes' => (int) env('IMPORT_MAX_FILE_KILOBYTES', 5120),
    'max_rows' => (int) env('IMPORT_MAX_ROWS', 5000),
    'max_processing_seconds' => (int) env('IMPORT_MAX_PROCESSING_SECONDS', 30),
    'max_uncompressed_megabytes' => (int) env('IMPORT_MAX_UNCOMPRESSED_MEGABYTES', 64),
    'max_memory_megabytes' => (int) env('IMPORT_MAX_MEMORY_MEGABYTES', 64),
];
