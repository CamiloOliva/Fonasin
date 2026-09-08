<?php

namespace App\Http\Requests\Imports;

use App\Application\Imports\DTO\UploadedSpreadsheet;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Validator;

class ImportSpreadsheetRequest extends FormRequest
{
    public const MAX_KILOBYTES = 5120;

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
            'file' => ['required', 'file', 'max:'.self::MAX_KILOBYTES],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $file = $this->file('file');

                if (! $file instanceof UploadedFile) {
                    return;
                }

                if (strtolower($file->getClientOriginalExtension()) !== 'xlsx') {
                    $validator->errors()->add('file', 'El archivo debe estar en formato XLSX.');
                }

                $allowedMimes = [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/zip',
                    'application/octet-stream',
                ];

                if (! in_array((string) $file->getMimeType(), $allowedMimes, true)) {
                    $validator->errors()->add('file', 'El archivo no tiene un tipo XLSX valido.');
                }
            },
        ];
    }

    public function spreadsheet(): UploadedSpreadsheet
    {
        /** @var UploadedFile $file */
        $file = $this->file('file');
        $contents = file_get_contents($file->getRealPath());

        return new UploadedSpreadsheet(
            path: (string) $file->getRealPath(),
            contents: is_string($contents) ? $contents : '',
            originalName: $file->getClientOriginalName(),
            extension: strtolower($file->getClientOriginalExtension()),
            mimeType: (string) $file->getMimeType(),
            byteSize: (int) $file->getSize(),
        );
    }
}
