<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\Request;

use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use App\Services\ProfileService;
use Exception;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['team', 'status', 'search', 'year', 'page', 'per_page']);

            $result = $this->profileService->getProfiles($filters);

            return response()->json([
                'code'       => HttpCode::SUCCESS,
                'status'     => true,
                'success'    => true, // retained for frontend compatibility
                'message'    => ResponseMessage::PROFILES_FETCHED,
                'data'       => $result['data'],
                'summary'    => $result['summary'],
                'year'       => $result['year'],
                'pagination' => $result['pagination'],
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
                'data'    => null,
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $data = $request->all();
            $profile = $this->profileService->updateProfile($id, $data);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'status'  => true,
                'success' => true,
                'message' => ResponseMessage::PROFILE_UPDATED,
                'data'    => $profile,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            $statusCode = $e->getCode() === 404 ? HttpCode::NOT_FOUND : HttpCode::INTERNAL_SERVER_ERROR;
            return response()->json([
                'code'    => $statusCode,
                'status'  => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error'   => $e->getMessage(),
                'data'    => null,
            ], $statusCode);
        }
    }
}
