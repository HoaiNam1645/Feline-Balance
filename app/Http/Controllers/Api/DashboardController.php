<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Models\Team;

class DashboardController extends Controller
{
    /**
     * Dashboard overview — aggregated data across modules.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $year = (int) $request->query('year', date('Y'));
            $month = $request->query('month'); // optional, null = all months
            $teamId = $request->query('team_id'); // optional
            $tab = $request->query('tab', 'overview'); // overview, topup, fulfill, stores, media, design, fulfillment

            $teams = Team::orderBy('name')->get(['id', 'name']);

            $data = match ($tab) {
                'topup' => $this->getTopupData($year, $month, $teamId),
                'stores' => $this->getStoresData($year, $month, $teamId),
                'media' => $this->getMediaData($year, $month, $teamId),
                'design' => $this->getDesignData($year, $month, $teamId),
                'fulfillment' => $this->getFulfillmentData($year, $month, $teamId),
                default => $this->getOverviewData($year, $month, $teamId),
            };

            return response()->json([
                'success' => true,
                'data' => $data,
                'teams' => $teams,
                'filters' => [
                    'year' => $year,
                    'month' => $month,
                    'team_id' => $teamId,
                    'tab' => $tab,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Dashboard error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /* ── Overview: summary of all modules ── */
    private function getOverviewData($year, $month, $teamId)
    {
        // Topup summary
        $topupQuery = DB::table('transactions')->whereNull('transactions.deleted_at')->whereYear('transactions.created_at', $year);
        if ($month) $topupQuery->whereMonth('transactions.created_at', $month);
        if ($teamId) $topupQuery->where('transactions.team_id', $teamId);

        $totalIncome = (clone $topupQuery)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $topupQuery)->where('type', 'expense')->sum('amount');
        $topupCount = (clone $topupQuery)->count();

        // Stores summary
        $storeQuery = DB::table('stores')->whereNull('stores.deleted_at');
        $totalStores = $storeQuery->count();
        $storePayQuery = DB::table('payment_histories')->whereYear('transaction_date', $year);
        if ($month) $storePayQuery->whereMonth('transaction_date', $month);
        $totalStorePayments = $storePayQuery->sum('net');

        // Media summary (uses transaction_date, matching MediaTransactionService)
        $mediaQuery = DB::table('media_transactions')->whereNull('media_transactions.deleted_at')->whereYear('media_transactions.transaction_date', $year);
        if ($month) $mediaQuery->whereMonth('media_transactions.transaction_date', $month);
        if ($teamId) $mediaQuery->where('media_transactions.team_id', $teamId);
        $mediaTotal = (clone $mediaQuery)->sum('amount');
        $mediaCount = (clone $mediaQuery)->count();

        // Design stats summary
        $designQuery = DB::table('design_statistics')->where('year', $year);
        if ($month) $designQuery->where('month', $month);
        if ($teamId) $designQuery->where('team_id', $teamId);
        $totalDesigns = (clone $designQuery)->sum('designs_count');

        // Fulfillment stats summary
        $fulfillQuery = DB::table('fulfillment_statistics')->where('year', $year)->where('fulfill_unit_id', 0);
        if ($month) $fulfillQuery->where('month', $month);
        if ($teamId) $fulfillQuery->where('team_id', $teamId);
        $totalOrders = (clone $fulfillQuery)->where('type', 'user')->sum('order_count');
        $totalFulfillPrice = (clone $fulfillQuery)->where('type', 'user')->sum('total_price');

        // Monthly trend (topup income/expense per month)
        $monthlyTrend = DB::table('transactions')
            ->whereNull('transactions.deleted_at')
            ->whereYear('transactions.created_at', $year)
            ->when($teamId, fn($q) => $q->where('transactions.team_id', $teamId))
            ->selectRaw("MONTH(transactions.created_at) as month,
                SUM(CASE WHEN transactions.type='income' THEN transactions.amount ELSE 0 END) as income,
                SUM(CASE WHEN transactions.type='expense' THEN transactions.amount ELSE 0 END) as expense,
                COUNT(*) as count")
            ->groupByRaw('MONTH(transactions.created_at)')
            ->orderByRaw('MONTH(transactions.created_at)')
            ->get();

        // Team comparison
        $teamComparison = DB::table('transactions')
            ->whereNull('transactions.deleted_at')
            ->whereYear('transactions.created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('transactions.created_at', $month))
            ->join('teams', 'transactions.team_id', '=', 'teams.id')
            ->selectRaw("teams.name as team_name, teams.id as team_id,
                SUM(CASE WHEN transactions.type='income' THEN transactions.amount ELSE 0 END) as income,
                SUM(CASE WHEN transactions.type='expense' THEN transactions.amount ELSE 0 END) as expense,
                COUNT(*) as count")
            ->groupBy('teams.id', 'teams.name')
            ->orderByDesc('income')
            ->get();

        return [
            'summary' => [
                'total_income' => round($totalIncome, 2),
                'total_expense' => round($totalExpense, 2),
                'net_profit' => round($totalIncome - $totalExpense, 2),
                'topup_count' => $topupCount,
                'total_stores' => $totalStores,
                'total_store_payments' => round($totalStorePayments, 2),
                'media_total' => round($mediaTotal, 2),
                'media_count' => $mediaCount,
                'total_designs' => $totalDesigns,
                'total_orders' => $totalOrders,
                'total_fulfill_price' => round($totalFulfillPrice, 2),
            ],
            'monthly_trend' => $monthlyTrend,
            'team_comparison' => $teamComparison,
        ];
    }

    /* ── Topup tab: transactions detail ── */
    private function getTopupData($year, $month, $teamId)
    {
        $base = DB::table('transactions')->whereNull('transactions.deleted_at')->whereYear('transactions.created_at', $year);
        if ($month) $base->whereMonth('transactions.created_at', $month);
        if ($teamId) $base->where('transactions.team_id', $teamId);

        $totalIncome = (clone $base)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $base)->where('type', 'expense')->sum('amount');
        $count = (clone $base)->count();
        $pendingCount = (clone $base)->where('status', 'pending')->count();
        $completedCount = (clone $base)->where('status', 'completed')->count();

        // Monthly breakdown
        $monthly = DB::table('transactions')
            ->whereNull('transactions.deleted_at')
            ->whereYear('transactions.created_at', $year)
            ->when($teamId, fn($q) => $q->where('transactions.team_id', $teamId))
            ->selectRaw("MONTH(transactions.created_at) as month,
                SUM(CASE WHEN transactions.type='income' THEN transactions.amount ELSE 0 END) as income,
                SUM(CASE WHEN transactions.type='expense' THEN transactions.amount ELSE 0 END) as expense,
                COUNT(*) as count")
            ->groupByRaw('MONTH(transactions.created_at)')
            ->orderByRaw('MONTH(transactions.created_at)')
            ->get();

        // By payment method
        $byMethod = DB::table('transactions')
            ->whereNull('transactions.deleted_at')
            ->whereYear('transactions.created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('transactions.created_at', $month))
            ->when($teamId, fn($q) => $q->where('transactions.team_id', $teamId))
            ->selectRaw("transactions.payment_method,
                SUM(CASE WHEN transactions.type='income' THEN transactions.amount ELSE 0 END) as income,
                SUM(CASE WHEN transactions.type='expense' THEN transactions.amount ELSE 0 END) as expense,
                COUNT(*) as count")
            ->groupBy('transactions.payment_method')
            ->get();

        // By team
        $byTeam = DB::table('transactions')
            ->whereNull('transactions.deleted_at')
            ->whereYear('transactions.created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('transactions.created_at', $month))
            ->join('teams', 'transactions.team_id', '=', 'teams.id')
            ->selectRaw("teams.name as team_name,
                SUM(CASE WHEN transactions.type='income' THEN transactions.amount ELSE 0 END) as income,
                SUM(CASE WHEN transactions.type='expense' THEN transactions.amount ELSE 0 END) as expense,
                COUNT(*) as count")
            ->groupBy('teams.name')
            ->orderByDesc('income')
            ->get();

        return [
            'summary' => [
                'total_income' => round($totalIncome, 2),
                'total_expense' => round($totalExpense, 2),
                'net' => round($totalIncome - $totalExpense, 2),
                'count' => $count,
                'pending' => $pendingCount,
                'completed' => $completedCount,
            ],
            'monthly' => $monthly,
            'by_method' => $byMethod,
            'by_team' => $byTeam,
        ];
    }

    /* ── Stores tab ── */
    private function getStoresData($year, $month, $teamId)
    {
        $totalStores = DB::table('stores')->whereNull('stores.deleted_at')->count();
        $activeStores = DB::table('stores')->whereNull('stores.deleted_at')->where('status', 'active')->count();

        // Payment history summary
        $phQuery = DB::table('payment_histories')
            ->whereYear('transaction_date', $year);
        if ($month) $phQuery->whereMonth('transaction_date', $month);

        $totalNet = (clone $phQuery)->sum('net');
        $totalFee = (clone $phQuery)->sum('fee');
        $txCount = (clone $phQuery)->count();

        // Monthly payments
        $monthly = DB::table('payment_histories')
            ->whereYear('transaction_date', $year)
            ->selectRaw("MONTH(transaction_date) as month,
                SUM(net) as total_net,
                SUM(fee) as total_fee,
                COUNT(*) as count")
            ->groupByRaw('MONTH(transaction_date)')
            ->orderByRaw('MONTH(transaction_date)')
            ->get();

        // Top stores by total amount
        $topStores = DB::table('stores')
            ->whereNull('stores.deleted_at')
            ->orderByDesc('total_amount')
            ->limit(10)
            ->get(['id', 'name', 'account_no', 'total_amount', 'total_payments', 'status']);

        return [
            'summary' => [
                'total_stores' => $totalStores,
                'active_stores' => $activeStores,
                'total_net' => round($totalNet, 2),
                'total_fee' => round($totalFee, 2),
                'tx_count' => $txCount,
            ],
            'monthly' => $monthly,
            'top_stores' => $topStores,
        ];
    }

    /* ── Media tab ── */
    private function getMediaData($year, $month, $teamId)
    {
        // Uses transaction_date to match MediaTransactionService logic
        $base = DB::table('media_transactions')->whereNull('media_transactions.deleted_at')->whereYear('media_transactions.transaction_date', $year);
        if ($month) $base->whereMonth('media_transactions.transaction_date', $month);
        if ($teamId) $base->where('media_transactions.team_id', $teamId);

        $totalAmount = (clone $base)->sum('amount');
        $count = (clone $base)->count();
        $completedAmount = (clone $base)->where('status', 'complete')->sum('amount');

        // Monthly (uses transaction_date)
        $monthly = DB::table('media_transactions')
            ->whereNull('media_transactions.deleted_at')
            ->whereYear('media_transactions.transaction_date', $year)
            ->when($teamId, fn($q) => $q->where('media_transactions.team_id', $teamId))
            ->selectRaw("MONTH(media_transactions.transaction_date) as month, SUM(media_transactions.amount) as total, COUNT(*) as count")
            ->groupByRaw('MONTH(media_transactions.transaction_date)')
            ->orderByRaw('MONTH(media_transactions.transaction_date)')
            ->get();

        // By bank
        $byBank = DB::table('media_transactions')
            ->whereNull('media_transactions.deleted_at')
            ->whereYear('media_transactions.transaction_date', $year)
            ->when($month, fn($q) => $q->whereMonth('media_transactions.transaction_date', $month))
            ->when($teamId, fn($q) => $q->where('media_transactions.team_id', $teamId))
            ->selectRaw("media_transactions.bank, SUM(media_transactions.amount) as total, COUNT(*) as count")
            ->groupBy('media_transactions.bank')
            ->orderByDesc('total')
            ->get();

        // By team
        $byTeam = DB::table('media_transactions')
            ->whereNull('media_transactions.deleted_at')
            ->whereYear('media_transactions.transaction_date', $year)
            ->when($month, fn($q) => $q->whereMonth('media_transactions.transaction_date', $month))
            ->join('teams', 'media_transactions.team_id', '=', 'teams.id')
            ->selectRaw("teams.name as team_name, SUM(media_transactions.amount) as total, COUNT(*) as count")
            ->groupBy('teams.name')
            ->orderByDesc('total')
            ->get();

        return [
            'summary' => [
                'total_amount' => round($totalAmount, 2),
                'count' => $count,
                'completed_amount' => round($completedAmount, 2),
            ],
            'monthly' => $monthly,
            'by_bank' => $byBank,
            'by_team' => $byTeam,
        ];
    }

    /* ── Design Statistics tab ── */
    private function getDesignData($year, $month, $teamId)
    {
        $base = DB::table('design_statistics')->where('year', $year);
        if ($month) $base->where('month', $month);
        if ($teamId) $base->where('team_id', $teamId);

        $totalDesigns = (clone $base)->sum('designs_count');
        $totalPrint = (clone $base)->sum('print_count');
        $totalEmbroidery = (clone $base)->sum('embroidery_count');
        $totalSticker = (clone $base)->sum('sticker_count');

        // Monthly
        $monthly = DB::table('design_statistics')
            ->where('year', $year)
            ->when($teamId, fn($q) => $q->where('team_id', $teamId))
            ->selectRaw("month, SUM(designs_count) as total_designs, SUM(print_count) as total_print, SUM(embroidery_count) as total_embroidery, SUM(sticker_count) as total_sticker")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // By team
        $byTeam = DB::table('design_statistics')
            ->where('year', $year)
            ->when($month, fn($q) => $q->where('month', $month))
            ->leftJoin('teams', 'design_statistics.team_id', '=', 'teams.id')
            ->selectRaw("COALESCE(teams.name, design_statistics.team_name, 'Unknown') as team_name,
                SUM(designs_count) as total_designs,
                SUM(print_count) as total_print,
                SUM(embroidery_count) as total_embroidery,
                SUM(sticker_count) as total_sticker")
            ->groupByRaw("COALESCE(teams.name, design_statistics.team_name, 'Unknown')")
            ->orderByDesc('total_designs')
            ->get();

        // Top designers
        $topDesigners = DB::table('design_statistics')
            ->where('year', $year)
            ->when($month, fn($q) => $q->where('month', $month))
            ->when($teamId, fn($q) => $q->where('team_id', $teamId))
            ->selectRaw("user_name, SUM(designs_count) as total_designs")
            ->groupBy('user_name')
            ->orderByDesc('total_designs')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_designs' => $totalDesigns,
                'total_print' => $totalPrint,
                'total_embroidery' => $totalEmbroidery,
                'total_sticker' => $totalSticker,
            ],
            'monthly' => $monthly,
            'by_team' => $byTeam,
            'top_designers' => $topDesigners,
        ];
    }

    /* ── Fulfillment Statistics tab ── */
    private function getFulfillmentData($year, $month, $teamId)
    {
        $base = DB::table('fulfillment_statistics')
            ->where('year', $year)
            ->where('type', 'user')
            ->where('fulfill_unit_id', 0);
        if ($month) $base->where('month', $month);
        if ($teamId) $base->where('team_id', $teamId);

        $totalOrders = (clone $base)->sum('order_count');
        $totalPrice = (clone $base)->sum('total_price');

        // Monthly
        $monthly = DB::table('fulfillment_statistics')
            ->where('year', $year)
            ->where('type', 'user')
            ->where('fulfill_unit_id', 0)
            ->when($teamId, fn($q) => $q->where('team_id', $teamId))
            ->selectRaw("month, SUM(order_count) as total_orders, SUM(total_price) as total_price")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // By team
        $byTeam = DB::table('fulfillment_statistics')
            ->where('fulfillment_statistics.year', $year)
            ->where('fulfillment_statistics.type', 'user')
            ->where('fulfillment_statistics.fulfill_unit_id', 0)
            ->when($month, fn($q) => $q->where('fulfillment_statistics.month', $month))
            ->leftJoin('teams', 'fulfillment_statistics.team_id', '=', 'teams.id')
            ->selectRaw("COALESCE(teams.name, fulfillment_statistics.team_name, 'Unknown') as team_name,
                SUM(fulfillment_statistics.order_count) as total_orders,
                SUM(fulfillment_statistics.total_price) as total_price")
            ->groupByRaw("COALESCE(teams.name, fulfillment_statistics.team_name, 'Unknown')")
            ->orderByDesc('total_orders')
            ->get();

        // Top fulfillers
        $topFulfillers = DB::table('fulfillment_statistics')
            ->where('year', $year)
            ->where('type', 'user')
            ->where('fulfill_unit_id', 0)
            ->when($month, fn($q) => $q->where('month', $month))
            ->when($teamId, fn($q) => $q->where('team_id', $teamId))
            ->selectRaw("name, SUM(order_count) as total_orders, SUM(total_price) as total_price")
            ->groupBy('name')
            ->orderByDesc('total_orders')
            ->limit(10)
            ->get();

        return [
            'summary' => [
                'total_orders' => $totalOrders,
                'total_price' => round($totalPrice, 2),
            ],
            'monthly' => $monthly,
            'by_team' => $byTeam,
            'top_fulfillers' => $topFulfillers,
        ];
    }
}
