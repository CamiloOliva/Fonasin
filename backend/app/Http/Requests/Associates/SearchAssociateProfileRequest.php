<?php

namespace App\Http\Requests\Associates;

use Illuminate\Foundation\Http\FormRequest;

class SearchAssociateProfileRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'document_number' => ['required', 'string', 'min:3', 'max:16'],
        ];
    }
}
