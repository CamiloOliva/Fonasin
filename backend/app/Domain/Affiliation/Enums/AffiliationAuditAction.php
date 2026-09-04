<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationAuditAction: string
{
    case ApplicationSubmitted = 'application.submitted';
    case ApplicationReviewStarted = 'application.review_started';
    case ApplicationCorrectionRequested = 'application.correction_requested';
    case ApplicationApproved = 'application.approved';
    case ApplicationEnabled = 'application.enabled';
    case ApplicationRejected = 'application.rejected';
    case ApplicationViewed = 'application.viewed';
    case DocumentUploaded = 'document.uploaded';
    case DocumentGenerated = 'document.generated';
    case DocumentViewed = 'document.viewed';
    case DocumentDownloaded = 'document.downloaded';
    case AssociateCreated = 'associate.created';
    case AssociateActivated = 'associate.activated';
    case AssociateDeactivated = 'associate.deactivated';
}
