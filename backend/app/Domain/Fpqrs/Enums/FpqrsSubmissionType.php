<?php

namespace App\Domain\Fpqrs\Enums;

enum FpqrsSubmissionType: string
{
    case Petition = 'petition';
    case Complaint = 'complaint';
    case Claim = 'claim';
    case Request = 'request';
    case Suggestion = 'suggestion';
}
