<?php

namespace App\Http\Requests\Contributions;

use App\Domain\Contributions\Enums\ContributionMovementStatus;
use App\Domain\Contributions\Enums\ContributionMovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListContributionMovementsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'movement_type' => ['nullable', Rule::enum(ContributionMovementType::class)],
            'status' => ['nullable', Rule::enum(ContributionMovementStatus::class)],
            'period' => ['nullable', 'date_format:Y-m'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
