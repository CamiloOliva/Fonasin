<?php

namespace App\Domain\Portal\Enums;

enum PortalAuditAction: string
{
    case AccountStatementViewed = 'portal.account_statement.viewed';
}
