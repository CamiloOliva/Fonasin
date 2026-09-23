<?php

namespace App\Domain\Contributions\Enums;

enum VoluntarySavingsRequestStatus: string
{
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
