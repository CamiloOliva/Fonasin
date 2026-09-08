<?php

namespace App\Domain\Audit\Enums;

enum AuditModule: string
{
    case Affiliation = 'affiliation';
    case Identity = 'identity';
    case Credits = 'credits';
    case Contributions = 'contributions';
    case Portal = 'portal';
    case Imports = 'imports';
    case Content = 'content';
    case Fpqrs = 'fpqrs';
}
