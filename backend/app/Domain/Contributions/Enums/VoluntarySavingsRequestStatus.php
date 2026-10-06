<?php

namespace App\Domain\Contributions\Enums;

enum VoluntarySavingsRequestStatus: string
{
    case Submitted = 'submitted';
    case AwaitingEmployerAuthorization = 'awaiting_employer_authorization';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
