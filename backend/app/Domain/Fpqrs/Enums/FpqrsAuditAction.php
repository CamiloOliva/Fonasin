<?php

namespace App\Domain\Fpqrs\Enums;

enum FpqrsAuditAction: string
{
    case SubmissionReceived = 'submission.received';
    case DeliverySent = 'delivery.sent';
    case DeliveryFailed = 'delivery.failed';
}
