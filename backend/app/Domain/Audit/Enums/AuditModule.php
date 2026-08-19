<?php

namespace App\Domain\Audit\Enums;

enum AuditModule: string
{
    case Affiliation = 'affiliation';
    case Identity = 'identity';
    case Credits = 'credits';
    case Portal = 'portal';
    case Content = 'content';
    case Fpqrs = 'fpqrs';
}
