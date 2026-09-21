<?php

namespace App\Domain\Portal\Enums;

enum PortalAuditAction: string
{
    case AccountStatementViewed = 'portal.account_statement.viewed';
    case AssociateProfileViewed = 'admin.associate_profile.viewed';
    case AssociateProfileExported = 'admin.associate_profile.exported';
}
