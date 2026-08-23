<?php

namespace App\Http\Requests\Affiliation;

use App\Domain\Affiliation\Enums\ApplicationDocumentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterApplicationDocumentRequest extends FormRequest
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
            'document_type' => ['required', Rule::in(array_map(
                fn (ApplicationDocumentType $documentType): string => $documentType->value,
                ApplicationDocumentType::requiredForSubmission(),
            ))],
            'file' => ['required', 'file', 'max:5120', 'mimetypes:application/pdf,image/jpeg,image/png'],
        ];
    }
}
