<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Constants\HttpCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class VendorController extends Controller
{
    /**
     * Get all active vendors.
     */
    public function index(): JsonResponse
    {
        try {
            $vendors = Vendor::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'created_at']);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Vendors fetched successfully.',
                'data'    => $vendors,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to fetch vendors: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create a new vendor.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'        => 'required|string|max:255|unique:vendors,name',
                'description' => 'nullable|string|max:500',
            ]);

            $vendor = Vendor::create($validated);

            return response()->json([
                'code'    => HttpCode::CREATED,
                'success' => true,
                'message' => 'Vendor created successfully.',
                'data'    => $vendor,
            ], HttpCode::CREATED);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to create vendor: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update a vendor.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);

            $validated = $request->validate([
                'name'        => 'sometimes|string|max:255|unique:vendors,name,' . $id,
                'description' => 'nullable|string|max:500',
                'is_active'   => 'sometimes|boolean',
            ]);

            $vendor->update($validated);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Vendor updated successfully.',
                'data'    => $vendor,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to update vendor: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a vendor.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail($id);
            $vendor->delete();

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Vendor deleted successfully.',
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to delete vendor: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
