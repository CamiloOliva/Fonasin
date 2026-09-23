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
            'file' => ['required', 'file', 'max:5120', 'mimetypes:application/pdf'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.uploaded' => 'El servidor no pudo recibir el PDF. Verifica que no supere 5 MB e intenta nuevamente.',
            'file.max' => 'El PDF no debe superar 5 MB.',
            'file.mimetypes' => 'El archivo debe ser un PDF valido.',
        ];
    }
}
