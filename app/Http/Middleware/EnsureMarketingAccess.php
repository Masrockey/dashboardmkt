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

        if (! $user) {
            abort(403, 'Anda tidak memiliki akses ke menu Marketing.');
        }

        if ($user->hasAnyRole(['superadmin', 'spv', 'kabag'])) {
            return $next($request);
        }

        if ($user->hasPermission('marketing.dashboard') || $user->hasPermission('marketing.r2') || $user->hasPermission('marketing')) {
            return $next($request);
        }

        $userPermissions = $user->getAllPermissions();
        foreach ($userPermissions as $p) {
            if (str_starts_with($p, 'marketing.')) {
                return $next($request);
            }
        }

        abort(403, 'Anda tidak memiliki akses ke menu Marketing.');

        return $next($request);
    }
}
