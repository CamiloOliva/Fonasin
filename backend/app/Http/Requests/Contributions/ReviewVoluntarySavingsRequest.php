<?php

namespace App\Http\Requests\Contributions;

use App\Domain\Contributions\Enums\VoluntarySavingsRequestStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewVoluntarySavingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                VoluntarySavingsRequestStatus::Approved->value,
                VoluntarySavingsRequestStatus::Rejected->value,
            ])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
