<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    /**
     * Login with email/username + password.
     */
    public function login(Request $request): array
    {
        $loginField = $request->input('login'); // could be email or username
        $password = $request->input('password');

        if (!$loginField || !$password) {
            return [
                'success' => false,
                'message' => 'Login and password are required.',
            ];
        }

        // Find user by email or username
        $user = User::where('email', $loginField)
            ->orWhere('username', $loginField)
            ->first();

        if (!$user) {
            return [
                'success' => false,
                'message' => 'Invalid credentials.',
            ];
        }

        if (!$user->is_active) {
            return [
                'success' => false,
                'message' => 'Account is deactivated.',
            ];
        }

        if (!Hash::check($password, $user->password)) {
            return [
                'success' => false,
                'message' => 'Invalid credentials.',
            ];
        }

        // Generate JWT
        $token = JWTAuth::fromUser($user);
        $tokenAndCookie = $this->generateTokenAndCookie($token);

        return [
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role?->name,
                    'role_display' => $user->role?->display_name,
                ],
                'token' => $tokenAndCookie['token'],
            ],
            'cookie' => $tokenAndCookie['cookie'],
        ];
    }

    /**
     * Get current user info from JWT.
     */
    public function me(): array
    {
        /** @var \App\Models\User|null $user */
        $user = auth('api')->user();

        if (!$user) {
            return ['success' => false, 'message' => 'Unauthenticated.'];
        }

        $user->load('role');

        return [
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role?->name,
                'role_display' => $user->role?->display_name,
            ],
        ];
    }

    /**
     * Refresh token.
     */
    public function refresh(): array
    {
        /** @var \PHPOpenSourceSaver\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        $newToken = $guard->refresh();
        $tokenAndCookie = $this->generateTokenAndCookie($newToken);

        return [
            'success' => true,
            'data' => ['token' => $tokenAndCookie['token']],
            'cookie' => $tokenAndCookie['cookie'],
        ];
    }

    /**
     * Generate JWT token and httpOnly cookie.
     */
    private function generateTokenAndCookie(string $token): array
    {
        $isHttps = str_starts_with(config('app.url'), 'https://');

        $cookie = cookie(
            'token',                       // name
            $token,                        // value
            (int) config('jwt.ttl'),       // minutes (from JWT config)
            '/',                           // path
            null,                          // domain (null = current domain)
            $isHttps,                      // secure - only true if HTTPS
            true,                          // httpOnly (prevent XSS)
            false,                         // raw
            'lax'                          // sameSite
        );

        return [
            'token' => $token,
            'cookie' => $cookie,
        ];
    }
}
