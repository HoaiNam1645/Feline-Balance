<?php

namespace App\Http\Controllers\Api;

use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use App\Http\Controllers\Controller;
use App\Models\Role;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $roles = Role::orderBy('id', 'asc')->get();

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Roles fetched successfully',
                'data' => $roles,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code' => HttpCode::INTERNAL_SERVER_ERROR,
                'status' => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error' => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:roles,name|max:255',
                'display_name' => 'required|string|max:255',
            ]);

            $role = Role::create($request->only(['name', 'display_name']));

            return response()->json([
                'code' => HttpCode::CREATED,
                'status' => true,
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $role,
            ], HttpCode::CREATED);
        } catch (Exception $e) {
            return response()->json([
                'code' => HttpCode::INTERNAL_SERVER_ERROR,
                'status' => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error' => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $id,
                'display_name' => 'required|string|max:255',
            ]);

            $role = Role::findOrFail($id);

            $role->update($request->only(['name', 'display_name']));

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $role,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code' => HttpCode::INTERNAL_SERVER_ERROR,
                'status' => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error' => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $role = Role::findOrFail($id);

            // Cannot delete protected roles
            if (in_array($role->name, ['super_admin', 'admin'])) {
                return response()->json([
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'success' => false,
                    'message' => 'Cannot delete system roles.',
                ], HttpCode::BAD_REQUEST);
            }

            // Check if users exist with this role
            if ($role->users()->count() > 0) {
                return response()->json([
                    'code' => HttpCode::BAD_REQUEST,
                    'status' => false,
                    'success' => false,
                    'message' => 'Cannot delete role assigned to users.',
                ], HttpCode::BAD_REQUEST);
            }

            $role->delete();

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Role deleted successfully',
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code' => HttpCode::INTERNAL_SERVER_ERROR,
                'status' => false,
                'success' => false,
                'message' => ResponseMessage::ERROR,
                'error' => $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
