<?php

namespace App\Domain\Identity\Enums;

enum IdentityAuditAction: string
{
    case AssociateActivationSent = 'associate.activation_sent';
}
