<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMarketingAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->hasPermission('marketing.dashboard') && ! $user?->hasPermission('marketing.r2') && ! $user?->hasAnyRole(['superadmin', 'spv', 'kabag'])) {
            abort(403, 'Anda tidak memiliki akses ke menu Marketing.');
        }

        return $next($request);
    }
}
