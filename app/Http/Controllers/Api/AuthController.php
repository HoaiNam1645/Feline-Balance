<?php

namespace App\Http\Controllers\Api;

use App\Constants\HttpCode;
use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    protected AuthService $authServices;

    public function __construct(AuthService $authServices)
    {
        $this->authServices = $authServices;
    }

    public function login(Request $request): JsonResponse
    {
        $result = $this->authServices->login($request);
        if (isset($result['cookie'])) {
            $cookie = $result['cookie'];
            unset($result['cookie']);
            return response()->json($result, 200, [], JSON_UNESCAPED_UNICODE)->cookie($cookie);
        }
        return response()->json($result, 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function me(): JsonResponse
    {
        $result = $this->authServices->me();
        $status = $result['success'] ? 200 : 401;
        return response()->json($result, $status, [], JSON_UNESCAPED_UNICODE);
    }

    public function logout()
    {
        return response()->json([
            'code' => HttpCode::SUCCESS,
            'status' => true,
            'message' => 'Đăng xuất thành công',
        ], 200, [], JSON_UNESCAPED_UNICODE)->withoutCookie('token');
    }

    public function refresh(): JsonResponse
    {
        $result = $this->authServices->refresh();
        if (isset($result['cookie'])) {
            $cookie = $result['cookie'];
            unset($result['cookie']);
            return response()->json($result, 200, [], JSON_UNESCAPED_UNICODE)->cookie($cookie);
        }
        return response()->json($result, 200, [], JSON_UNESCAPED_UNICODE);
    }
}
