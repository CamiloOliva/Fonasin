<?php

namespace App\Domain\Imports\Enums;

enum ImportAuditAction: string
{
    case ImportViewed = 'import.viewed';
    case ImportCompleted = 'import.completed';
    case ImportRejected = 'import.rejected';
}
