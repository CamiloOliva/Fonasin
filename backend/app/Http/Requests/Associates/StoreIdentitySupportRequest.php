<?php

namespace App\Http\Requests\Associates;

use Illuminate\Foundation\Http\FormRequest;

class StoreIdentitySupportRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:5120', 'mimetypes:application/pdf,image/jpeg,image/png'],
        ];
    }
}
