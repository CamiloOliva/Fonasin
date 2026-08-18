<?php

namespace Tests\Unit;

use App\Domain\Affiliation\Enums\AffiliationApplicationStatus;
use App\Domain\Affiliation\Support\AffiliationApplicationStateMachine;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AffiliationApplicationStateMachineTest extends TestCase
{
    #[DataProvider('validTransitions')]
    public function test_it_allows_documented_affiliation_transitions(
        AffiliationApplicationStatus $from,
        AffiliationApplicationStatus $to,
    ): void {
        $stateMachine = new AffiliationApplicationStateMachine;

        $this->assertTrue($stateMachine->canTransition($from, $to));
    }

    #[DataProvider('invalidTransitions')]
    public function test_it_rejects_undocumented_affiliation_transitions(
        AffiliationApplicationStatus $from,
        AffiliationApplicationStatus $to,
    ): void {
        $stateMachine = new AffiliationApplicationStateMachine;

        $this->assertFalse($stateMachine->canTransition($from, $to));
    }

    public function test_it_exposes_terminal_statuses(): void
    {
        $stateMachine = new AffiliationApplicationStateMachine;

        $this->assertTrue($stateMachine->isTerminal(AffiliationApplicationStatus::Withdrawn));
        $this->assertTrue($stateMachine->isTerminal(AffiliationApplicationStatus::Rejected));
        $this->assertTrue($stateMachine->isTerminal(AffiliationApplicationStatus::Cancelled));
        $this->assertFalse($stateMachine->isTerminal(AffiliationApplicationStatus::Draft));
    }

    /**
     * @return iterable<string, array{AffiliationApplicationStatus, AffiliationApplicationStatus}>
     */
    public static function validTransitions(): iterable
    {
        yield 'draft to submitted' => [
            AffiliationApplicationStatus::Draft,
            AffiliationApplicationStatus::Submitted,
        ];
        yield 'draft to cancelled' => [
            AffiliationApplicationStatus::Draft,
            AffiliationApplicationStatus::Cancelled,
        ];
        yield 'submitted to under review' => [
            AffiliationApplicationStatus::Submitted,
            AffiliationApplicationStatus::UnderReview,
        ];
        yield 'under review to pending correction' => [
            AffiliationApplicationStatus::UnderReview,
            AffiliationApplicationStatus::PendingCorrection,
        ];
        yield 'under review to approved' => [
            AffiliationApplicationStatus::UnderReview,
            AffiliationApplicationStatus::Approved,
        ];
        yield 'under review to rejected' => [
            AffiliationApplicationStatus::UnderReview,
            AffiliationApplicationStatus::Rejected,
        ];
        yield 'pending correction to submitted' => [
            AffiliationApplicationStatus::PendingCorrection,
            AffiliationApplicationStatus::Submitted,
        ];
        yield 'pending correction to cancelled' => [
            AffiliationApplicationStatus::PendingCorrection,
            AffiliationApplicationStatus::Cancelled,
        ];
        yield 'approved to enabled' => [
            AffiliationApplicationStatus::Approved,
            AffiliationApplicationStatus::Enabled,
        ];
        yield 'approved to pending correction' => [
            AffiliationApplicationStatus::Approved,
            AffiliationApplicationStatus::PendingCorrection,
        ];
        yield 'enabled to disabled' => [
            AffiliationApplicationStatus::Enabled,
            AffiliationApplicationStatus::Disabled,
        ];
        yield 'enabled to withdrawn' => [
            AffiliationApplicationStatus::Enabled,
            AffiliationApplicationStatus::Withdrawn,
        ];
        yield 'disabled to enabled' => [
            AffiliationApplicationStatus::Disabled,
            AffiliationApplicationStatus::Enabled,
        ];
        yield 'disabled to withdrawn' => [
            AffiliationApplicationStatus::Disabled,
            AffiliationApplicationStatus::Withdrawn,
        ];
    }

    /**
     * @return iterable<string, array{AffiliationApplicationStatus, AffiliationApplicationStatus}>
     */
    public static function invalidTransitions(): iterable
    {
        yield 'draft cannot jump to approved' => [
            AffiliationApplicationStatus::Draft,
            AffiliationApplicationStatus::Approved,
        ];
        yield 'submitted cannot jump to approved' => [
            AffiliationApplicationStatus::Submitted,
            AffiliationApplicationStatus::Approved,
        ];
        yield 'approved cannot go to rejected' => [
            AffiliationApplicationStatus::Approved,
            AffiliationApplicationStatus::Rejected,
        ];
        yield 'enabled cannot go back to draft' => [
            AffiliationApplicationStatus::Enabled,
            AffiliationApplicationStatus::Draft,
        ];
        yield 'rejected is terminal' => [
            AffiliationApplicationStatus::Rejected,
            AffiliationApplicationStatus::UnderReview,
        ];
        yield 'cancelled is terminal' => [
            AffiliationApplicationStatus::Cancelled,
            AffiliationApplicationStatus::Submitted,
        ];
        yield 'withdrawn is terminal' => [
            AffiliationApplicationStatus::Withdrawn,
            AffiliationApplicationStatus::Enabled,
        ];
    }
}
