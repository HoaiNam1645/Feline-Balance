<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleSuperAdmin
{
    /**
     * Allow access only for super_admin role.
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var \App\Models\User|null $user */
        $user = auth('api')->user();

        if (!$user || !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Super Admin access required.',
            ], 403);
        }

        return $next($request);
    }
}
