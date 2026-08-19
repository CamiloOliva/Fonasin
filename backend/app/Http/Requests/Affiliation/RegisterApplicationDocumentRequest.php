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
            'document_type' => ['required', Rule::enum(ApplicationDocumentType::class)],
            'original_filename' => ['required', 'string', 'max:255'],
            'mime_type' => ['required', 'string', Rule::in(['application/pdf', 'image/jpeg', 'image/png'])],
            'byte_size' => ['required', 'integer', 'min:1'],
        ];
    }
}
