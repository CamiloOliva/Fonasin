<?php

namespace App\Domain\Affiliation\Enums;

enum AffiliationApplicationStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case UnderReview = 'under_review';
    case PendingCorrection = 'pending_correction';
    case Approved = 'approved';
    case Enabled = 'enabled';
    case Disabled = 'disabled';
    case Withdrawn = 'withdrawn';
    case Rejected = 'rejected';
    case Cancelled = 'cancelled';
}
