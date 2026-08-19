<?php

namespace App\Http\Requests\Fpqrs;

use App\Domain\Fpqrs\Enums\FpqrsSubmissionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFpqrsSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'submission_type' => ['required', Rule::enum(FpqrsSubmissionType::class)],
            'message' => ['required', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimetypes:application/pdf,image/jpeg,image/png'],
        ];
    }
}
