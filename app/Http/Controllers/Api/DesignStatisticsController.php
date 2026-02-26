<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FelineService;
use App\Constants\HttpCode;
use App\Constants\ResponseMessage;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DesignStatisticsController extends Controller
{
    private FelineService $felineService;

    public function __construct(FelineService $felineService)
    {
        $this->felineService = $felineService;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $year = (int) $request->query('year', date('Y'));
            $month = (int) $request->query('month', date('n'));
            $page = (int) $request->query('page', 1);
            $perPage = (int) $request->query('per_page', 20);
            $searchUser = $request->query('user', '');
            $searchTeam = $request->query('team', '');

            // Fetch ALL data from Feline API (cached 10 min)
            $result = $this->felineService->getDesignStatistics($year, $month);
            $allData = collect($result['data'] ?? []);
            $dateLabel = $result['date'] ?? "{$month}/{$year}";

            // Extract unique teams for filter dropdown
            $teams = $allData
                ->map(fn($item) => $item['user_detail']['team']['name'] ?? null)
                ->filter()
                ->unique()
                ->sort()
                ->values()
                ->toArray();

            // Filter by user name
            if (!empty($searchUser)) {
                $allData = $allData->filter(function ($item) use ($searchUser) {
                    return stripos($item['name'] ?? '', $searchUser) !== false;
                });
            }

            // Filter by team name
            if (!empty($searchTeam)) {
                $allData = $allData->filter(function ($item) use ($searchTeam) {
                    $teamName = $item['user_detail']['team']['name'] ?? '';
                    return stripos($teamName, $searchTeam) !== false;
                });
            }

            // Summary (after filters, before pagination)
            $totalDesigns = $allData->sum('designs_count');
            $totalPrint = $allData->sum('print_count');
            $totalEmbroidery = $allData->sum('embroidery_count');
            $totalSticker = $allData->sum('sticker_count');
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
                'message' => 'Design statistics fetched successfully.',
                'data' => $pageData,
                'pagination' => [
                    'current_page' => $page,
                    'last_page' => $totalPages,
                    'per_page' => $perPage,
                    'total' => $totalFiltered,
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
