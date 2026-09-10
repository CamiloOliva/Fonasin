<?php

namespace App\Http\Requests\Contributions;

use App\Domain\Contributions\Enums\ContributionAccountStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListContributionAccountsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'associate_id' => ['nullable', 'uuid', 'exists:associates,id'],
            'status' => ['nullable', Rule::enum(ContributionAccountStatus::class)],
            'period' => ['nullable', 'date_format:Y-m'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
