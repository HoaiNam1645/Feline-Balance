<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Constants\HttpCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class CompanyController extends Controller
{
    /**
     * Get all active companies.
     */
    public function index(): JsonResponse
    {
        try {
            $companies = Company::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'created_at']);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Companies fetched successfully.',
                'data'    => $companies,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to fetch companies: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create a new company.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'        => 'required|string|max:255|unique:companies,name',
                'description' => 'nullable|string|max:500',
            ]);

            $company = Company::create($validated);

            return response()->json([
                'code'    => HttpCode::CREATED,
                'success' => true,
                'message' => 'Company created successfully.',
                'data'    => $company,
            ], HttpCode::CREATED);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to create company: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update a company.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);

            $validated = $request->validate([
                'name'        => 'sometimes|string|max:255|unique:companies,name,' . $id,
                'description' => 'nullable|string|max:500',
                'is_active'   => 'sometimes|boolean',
            ]);

            $company->update($validated);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Company updated successfully.',
                'data'    => $company,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to update company: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a company.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);
            $company->delete();

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Company deleted successfully.',
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to delete company: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
