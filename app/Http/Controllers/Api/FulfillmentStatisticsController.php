<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FulfillmentStatistic;
use App\Models\FulfillUnit;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FulfillmentStatisticsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $type = $request->query('type', 'user'); // 'user' or 'store'
            $year = (int) $request->query('year', date('Y'));
            $month = (int) $request->query('month', date('n'));
            $page = (int) $request->query('page', 1);
            $perPage = (int) $request->query('per_page', 20);
            $searchUser = $request->query('user', '');
            $searchTeam = $request->query('team', '');
            $fulfillId = $request->query('fulfill_id') ? (int) $request->query('fulfill_id') : 0; // default 0 is Total

            $dateLabel = "{$month}/{$year}";

            // Fetch fulfill units from Local DB
            $fulfillUnits = FulfillUnit::all()->toArray();

            // Query Local DB
            $query = FulfillmentStatistic::query()
                ->where('type', $type)
                ->where('year', $year)
                ->where('month', $month)
                ->where('fulfill_unit_id', $fulfillId);

            if (!empty($searchUser)) {
                $query->where('name', 'like', '%' . $searchUser . '%');
            }

            if (!empty($searchTeam)) {
                $query->where('team_id', $searchTeam);
            }

            // Database Teams for Filter Dropdown
            $teams = \App\Models\Team::orderBy('name')->get(['id', 'name'])->toArray();

            // Setup summary query before pagination
            $summaryQuery = clone $query;
            $totalOrds = $summaryQuery->sum('order_count');
            $totalFulfillPrice = $summaryQuery->sum('total_price');

            // Paginate
            $pageData = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Fulfillment statistics fetched successfully.',
                'data' => $pageData->items(),
                'pagination' => [
                    'current_page' => $pageData->currentPage(),
                    'last_page' => $pageData->lastPage(),
                    'per_page' => $pageData->perPage(),
                    'total' => $pageData->total(),
                ],
                'summary' => [
                    'total_ords' => $totalOrds,
                    'total_fulfill_price' => round($totalFulfillPrice, 2),
                ],
                'date' => $dateLabel,
                'teams' => $teams,
                'fulfill_units' => $fulfillUnits,
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
