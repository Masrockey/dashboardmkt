<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMasterDataAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user?->hasPermission('master_data.access') && ! $user?->hasAnyRole(['superadmin', 'spv'])) {
            abort(403, 'Anda tidak memiliki akses ke Master Data.');
        }

        return $next($request);
    }
}
