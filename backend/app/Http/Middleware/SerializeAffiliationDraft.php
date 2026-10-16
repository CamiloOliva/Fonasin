<?php

namespace App\Http\Middleware;

use App\Models\AffiliationApplication;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SerializeAffiliationDraft
{
    public function handle(Request $request, Closure $next): Response
    {
        $application = $request->route('application');
        if ($request->isMethod('GET') || ! $application instanceof AffiliationApplication) {
            return $next($request);
        }

        // State and token authorization in the controller must see the same row
        // as the write, including a concurrent submit or correction reissue.
        return DB::transaction(function () use ($request, $next, $application): Response {
            $locked = AffiliationApplication::query()->lockForUpdate()->findOrFail($application->id);
            $request->route()->setParameter('application', $locked);

            return $next($request);
        });
    }
}
