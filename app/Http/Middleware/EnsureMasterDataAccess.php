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

        if (! $user) {
            abort(403, 'Anda tidak memiliki akses ke Master Data.');
        }

        if ($user->hasAnyRole(['superadmin', 'spv'])) {
            return $next($request);
        }

        if ($user->hasPermission('master_data.access')) {
            return $next($request);
        }

        if ($request->is('jenis-pameran*')) {
            if ($user->hasPermission('pcd.jenis_channel')) {
                return $next($request);
            }
        }

        $resourceMap = [
            'segments' => 'segments',
            'brands' => 'brands',
            'categories' => 'categories',
            'kabupatens' => 'kabupatens',
            'types' => 'types',
            'series' => 'series',
        ];

        foreach ($resourceMap as $uri => $feature) {
            if ($request->is("{$uri}*")) {
                if ($user->hasPermission("master_data.{$feature}")) {
                    return $next($request);
                }
            }
        }

        $userPermissions = $user->getAllPermissions();
        foreach ($userPermissions as $p) {
            if (str_starts_with($p, 'master_data.')) {
                return $next($request);
            }
        }

        abort(403, 'Anda tidak memiliki akses ke Master Data.');

        return $next($request);
    }
}
