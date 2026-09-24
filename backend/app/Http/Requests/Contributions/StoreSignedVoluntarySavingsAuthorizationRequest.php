<?php

namespace App\Http\Requests\Contributions;

use Illuminate\Foundation\Http\FormRequest;

class StoreSignedVoluntarySavingsAuthorizationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120', 'mimetypes:application/pdf'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.uploaded' => 'El servidor no pudo recibir la libranza firmada.',
            'file.max' => 'La libranza firmada no debe superar 5 MB.',
            'file.mimetypes' => 'La libranza firmada debe ser un PDF.',
        ];
    }
}
