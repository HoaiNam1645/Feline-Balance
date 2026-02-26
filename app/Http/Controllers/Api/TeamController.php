<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Constants\HttpCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class TeamController extends Controller
{
    /**
     * Get all active teams.
     */
    public function index(): JsonResponse
    {
        try {
            $teams = Team::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'created_at']);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Teams fetched successfully.',
                'data'    => $teams,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to fetch teams: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Create a new team.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name'        => 'required|string|max:255|unique:teams,name',
                'description' => 'nullable|string|max:500',
            ]);

            $team = Team::create($validated);

            return response()->json([
                'code'    => HttpCode::CREATED,
                'success' => true,
                'message' => 'Team created successfully.',
                'data'    => $team,
            ], HttpCode::CREATED);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to create team: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update a team.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $team = Team::findOrFail($id);

            $validated = $request->validate([
                'name'        => 'sometimes|string|max:255|unique:teams,name,' . $id,
                'description' => 'nullable|string|max:500',
                'is_active'   => 'sometimes|boolean',
            ]);

            $team->update($validated);

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Team updated successfully.',
                'data'    => $team,
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to update team: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Delete a team.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $team = Team::findOrFail($id);
            $team->delete();

            return response()->json([
                'code'    => HttpCode::SUCCESS,
                'success' => true,
                'message' => 'Team deleted successfully.',
            ], HttpCode::SUCCESS);
        } catch (Exception $e) {
            return response()->json([
                'code'    => HttpCode::INTERNAL_SERVER_ERROR,
                'success' => false,
                'message' => 'Failed to delete team: ' . $e->getMessage(),
            ], HttpCode::INTERNAL_SERVER_ERROR);
        }
    }
}
