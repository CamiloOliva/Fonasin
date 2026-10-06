<?php

namespace App\Http\Requests\Content;

use Closure;
use Illuminate\Foundation\Http\FormRequest;

class SavePublicSiteSettingsRequest extends FormRequest
{
    public function rules(): array
    {
        $social = function (array $hosts): Closure {
            return static function (string $attribute, mixed $value, Closure $fail) use ($hosts): void {
                if ($value === null || $value === '') {
                    return;
                }
                $parts = parse_url((string) $value);
                $host = strtolower((string) ($parts['host'] ?? ''));
                if (! is_array($parts) || ($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass'])
                    || ! in_array($host, [...$hosts, ...array_map(fn (string $h): string => 'www.'.$h, $hosts)], true)) {
                    $fail('El enlace de red social debe ser HTTPS y pertenecer a la plataforma oficial.');
                }
            };
        };

        return [
            'contact_email' => ['required', 'email:rfc', 'max:255'],
            'facebook_url' => ['nullable', 'url', 'max:500', $social(['facebook.com'])],
            'instagram_url' => ['nullable', 'url', 'max:500', $social(['instagram.com'])],
            'youtube_url' => ['nullable', 'url', 'max:500', $social(['youtube.com', 'youtu.be'])],
        ];
    }
}
