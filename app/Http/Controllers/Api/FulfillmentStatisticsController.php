<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FelineService;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FulfillmentStatisticsController extends Controller
{
    private FelineService $felineService;

    public function __construct(FelineService $felineService)
    {
        $this->felineService = $felineService;
    }

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
            $fulfillId = $request->query('fulfill_id') ? (int) $request->query('fulfill_id') : null;

            // Fetch ALL data from Feline API (cached 10 min)
            $result = $this->felineService->getFulfillmentStatistics($type, $year, $month, $fulfillId);
            $allData = collect($result['data'] ?? []);
            $dateLabel = $result['date'] ?? "{$month}/{$year}";

            // Fetch fulfill units for the select dropdown
            $fulfillUnitsResult = $this->felineService->getFulfillUnits();
            $fulfillUnits = $fulfillUnitsResult['data'] ?? [];

            // Extract unique teams for filter dropdown
            $teams = $allData
                ->map(function ($item) {
                    if (isset($item['user_detail']['team']['name'])) {
                        return $item['user_detail']['team']['name'];
                    }

                    // For type == store, team might be under user->user_detail->team
                    if (isset($item['user']['user_detail']['team']['name'])) {
                        return $item['user']['user_detail']['team']['name'];
                    }

                    return null;
                })
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            // Filter by user name
            if (!empty($searchUser)) {
                $allData = $allData->filter(function ($item) use ($searchUser, $type) {
                    $name = $type === 'store' ? ($item['user']['name'] ?? '') : ($item['name'] ?? '');
                    return stripos($name, $searchUser) !== false;
                });
            }

            // Filter by team name
            if (!empty($searchTeam)) {
                $allData = $allData->filter(function ($item) use ($searchTeam, $type) {
                    $teamName = '';
                    if ($type === 'store') {
                        $teamName = $item['user']['user_detail']['team']['name'] ?? '';
                    } else {
                        $teamName = $item['user_detail']['team']['name'] ?? '';
                    }
                    return stripos($teamName, $searchTeam) !== false;
                });
            }

            // Summary (after filters, before pagination)
            $totalOrds = $allData->sum('order_fulfillments_count');
            $totalFulfillPrice = $allData->sum('total_fulfill_price');
            $totalFiltered = $allData->count();

            // Paginate locally
            $totalPages = max(1, ceil($totalFiltered / $perPage));
            $page = min($page, $totalPages);
            $offset = ($page - 1) * $perPage;
            $pageData = $allData->values()->slice($offset, $perPage)->values();

            return response()->json([
                'code' => HttpCode::SUCCESS,
                'status' => true,
                'success' => true,
                'message' => 'Fulfillment statistics fetched successfully.',
                'data' => $pageData,
                'pagination' => [
                    'current_page' => $page,
                    'last_page' => $totalPages,
                    'per_page' => $perPage,
                    'total' => $totalFiltered,
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
