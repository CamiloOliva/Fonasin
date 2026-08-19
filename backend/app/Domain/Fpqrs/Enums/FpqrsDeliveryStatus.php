<?php

namespace App\Domain\Fpqrs\Enums;

enum FpqrsDeliveryStatus: string
{
    case Pending = 'pending';
    case Sent = 'sent';
    case Failed = 'failed';
}
