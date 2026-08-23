<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationAuditAction: string
{
    case ApplicationSubmitted = 'application.submitted';
    case ApplicationReviewStarted = 'application.review_started';
    case ApplicationCorrectionRequested = 'application.correction_requested';
    case ApplicationApproved = 'application.approved';
    case ApplicationRejected = 'application.rejected';
    case DocumentUploaded = 'document.uploaded';
    case DocumentGenerated = 'document.generated';
    case DocumentDownloaded = 'document.downloaded';
}
