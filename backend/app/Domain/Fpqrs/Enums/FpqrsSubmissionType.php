<?php

namespace App\Domain\Fpqrs\Enums;

enum FpqrsSubmissionType: string
{
    case DebtCertificate = 'debt_certificate';
    case TaxCertificate = 'tax_certificate';
    case Clearance = 'clearance';
    case VoluntarySavingsWithdrawal = 'voluntary_savings_withdrawal';
    case PermanentSavings20Withdrawal = 'permanent_savings_20_withdrawal';
    case SavingsWithdrawal = 'savings_withdrawal';
    case Petition = 'petition';
    case Complaint = 'complaint';
    case Claim = 'claim';
    case Request = 'request';
    case Suggestion = 'suggestion';
    case Compliment = 'compliment';
    case RightToPetition = 'right_to_petition';
}