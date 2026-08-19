<?php

namespace App\Domain\Audit\Enums;

enum AuditActorType: string
{
    case User = 'user';
    case System = 'system';
}
