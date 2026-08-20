<?php

namespace App\Domain\Affiliation\Enums;

enum ApplicationDocumentStatus: string
{
    case Uploaded = 'uploaded';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
    case Archived = 'archived';
}
