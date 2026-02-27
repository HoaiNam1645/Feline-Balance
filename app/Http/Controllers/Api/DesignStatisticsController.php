<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DesignStatistic;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DesignStatisticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $year = (int) $request->query('year', date('Y'));
            $month = (int) $request->query('month', date('n'));
            $page = (int) $request->query('page', 1);
            $perPage = (int) $request->query('per_page', 20);
            $searchUser = $request->query('user', '');
            $searchTeam = $request->query('team', '');

            $dateLabel = "{$month}/{$year}";

            // Query Local DB
            $query = DesignStatistic::query()
                ->where('year', $year)
                ->where('month', $month);

            if (!empty($searchUser)) {
                $query->where('user_name', 'like', '%' . $searchUser . '%');
            }

            if (!empty($searchTeam)) {
                $query->where('team_id', $searchTeam);
            }

            // Database Teams for Filter Dropdown
            $teams = \App\Models\Team::orderBy('name')->get(['id', 'name'])->toArray();

            // Setup summary query before pagination
            $summaryQuery = clone $query;
            $totalDesigns = $summaryQuery->sum('designs_count');
            $totalPrint = $summaryQuery->sum('print_count');
            $totalEmbroidery = $summaryQuery->sum('embroidery_count');
            $totalSticker = $summaryQuery->sum('sticker_count');
            $totalFiltered = $summaryQuery->count();

            // Paginate
            $pageData = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Design statistics fetched successfully.',
                'data' => $pageData->items(),
                'pagination' => [
                    'current_page' => $pageData->currentPage(),
                    'last_page' => $pageData->lastPage(),
                    'per_page' => $pageData->perPage(),
                    'total' => $pageData->total(),
                ],
                'summary' => [
                    'total_designs' => $totalDesigns,
                    'total_print' => $totalPrint,
                    'total_embroidery' => $totalEmbroidery,
                    'total_sticker' => $totalSticker,
                ],
                'date' => $dateLabel,
                'teams' => $teams,
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
