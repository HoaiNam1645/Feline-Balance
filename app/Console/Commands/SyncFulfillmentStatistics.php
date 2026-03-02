<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FelineService;
use App\Models\FulfillmentStatistic;
use App\Models\FulfillUnit;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SyncFulfillmentStatistics extends Command
{
    protected $signature = 'sync:fulfillment-statistics {--year=} {--month=} {--all}';

    protected $description = 'Fetch fulfillment statistics and units from Feline API and save to local DB';

    public function handle(FelineService $felineService)
    {
        $isAll = $this->option('all');
        Log::info("SYNC_FULFILLMENT_STATISTICS: Command started. [All: {$isAll}, Year: {$this->option('year')}, Month: {$this->option('month')}]");

        $this->syncFulfillUnits($felineService);

        $periodsToSync = [];

        if ($isAll) {
            $startYear = 2024; // Lấy dữ liệu lịch sử từ 2024
            $currentYear = now()->year;
            $currentMonth = now()->month;

            for ($y = $startYear; $y <= $currentYear; $y++) {
                $endMonth = ($y === $currentYear) ? $currentMonth : 12;
                for ($m = 1; $m <= $endMonth; $m++) {
                    $periodsToSync[] = ['year' => $y, 'month' => $m];
                }
            }
        } else {
            $year = $this->option('year') ? (int) $this->option('year') : now()->year;
            $month = $this->option('month') ? (int) $this->option('month') : now()->month;
            $periodsToSync[] = ['year' => $year, 'month' => $month];

            if (now()->day <= 5 && !$this->option('year') && !$this->option('month')) {
                $prevMonth = now()->copy()->subMonth();
                $periodsToSync[] = ['year' => $prevMonth->year, 'month' => $prevMonth->month];
            }
        }

        $fulfillUnits = FulfillUnit::pluck('id')->toArray();
        $unitIdsToSync = array_merge([null], $fulfillUnits); // null is for 'Total'

        $teamUserMap = DB::table('team_user')->pluck('team_id', 'user_id');

        foreach ($periodsToSync as $period) {
            foreach (['user', 'store'] as $type) {
                foreach ($unitIdsToSync as $fulfillId) {
                    $this->syncPeriodTypeUnit($felineService, $teamUserMap, $period['year'], $period['month'], $type, $fulfillId);
                }
            }
        }

        $this->info("[" . now()->toDateTimeString() . "] SyncFulfillmentStatistics completed successfully.");
        Log::info("SYNC_FULFILLMENT_STATISTICS: Command completed successfully.");
    }

    private function syncFulfillUnits(FelineService $felineService)
    {
        $this->info("[" . now()->toDateTimeString() . "] Syncing Fulfill Units...");
        try {
            $result = $felineService->getFulfillUnits();
            $data = $result['data'] ?? [];
            if (empty($data)) return;

            $upsertData = [];
            foreach ($data as $item) {
                $upsertData[] = [
                    'id' => $item['id'],
                    'name' => $item['name'] ?? 'Unknown Unit',
                    'classname' => $item['classname'] ?? null,
                    'status' => $item['status'] ?? null,
                ];
            }

            FulfillUnit::upsert($upsertData, ['id'], ['name', 'classname', 'status']);
            $count = count($upsertData);
            $this->info("[" . now()->toDateTimeString() . "] Synced {$count} Fulfill Units.");
            Log::info("SYNC_FULFILLMENT_STATISTICS: Synced {$count} Fulfill Units.");
        } catch (\Exception $e) {
            $msg = "Failed to sync fulfill units: " . $e->getMessage();
            $this->error("[" . now()->toDateTimeString() . "] " . $msg);
            Log::error("SYNC_FULFILLMENT_STATISTICS: {$msg}");
        }
    }

    private function syncPeriodTypeUnit(FelineService $felineService, $teamUserMap, int $year, int $month, string $type, ?int $fulfillId)
    {
        $unitLabel = $fulfillId === null ? "TOTAL" : "Unit {$fulfillId}";
        $this->info("[" . now()->toDateTimeString() . "] Syncing {$type} | {$month}/{$year} | {$unitLabel}");

        // Build a team name lookup from local DB: team_id => team_name
        static $teamNameMap = null;
        if ($teamNameMap === null) {
            $teamNameMap = DB::table('teams')->pluck('name', 'id');
        }

        try {
            $result = $felineService->getFulfillmentStatistics($type, $year, $month, $fulfillId);
            $data = $result['data'] ?? [];

            if (empty($data)) {
                return;
            }

            $upsertData = [];

            foreach ($data as $item) {
                $teamId = null;
                $teamName = null;
                $roleName = null;
                $accountCode = null;
                $statusName = null;
                $avatar = null;
                $name = 'Unknown';

                if ($type === 'user') {
                    $userId = $item['id'];
                    $teamId = $teamUserMap[$userId] ?? null;
                    $teamName = $item['user_detail']['team']['name'] ?? null;
                    $roleName = $item['role']['name'] ?? null;
                    $avatar = $item['avatar'] ?? null;
                    $name = $item['name'] ?? 'Unknown';
                } else {
                    // type === 'store'
                    // store JSON: { id, store_name, user_id, user: {id, name, avatar}, status: {name}, detail: {account_code}, tiktok_detail: {shop_code} }
                    $userId = $item['user_id'] ?? null;
                    $teamId = $userId ? ($teamUserMap[$userId] ?? null) : null;
                    // store API doesn't nest user_detail.team — resolve team_name via local DB
                    $teamName = $teamId ? ($teamNameMap[$teamId] ?? null) : null;
                    $avatar = $item['user']['avatar'] ?? null;
                    $accountCode = $item['detail']['account_code'] ?? null;
                    $statusName = $item['status']['name'] ?? null;

                    // name column = user name (from data.user.name)
                    $name = $item['user']['name'] ?? 'Unknown';
                }

                $upsertData[] = [
                    'type' => $type,
                    'external_id' => $item['id'],
                    'name' => $name,
                    'avatar' => $avatar,
                    'team_id' => $teamId,
                    'team_name' => $teamName,
                    'role_name' => $roleName,
                    'account_code' => $accountCode,
                    'status_name' => $statusName,
                    'fulfill_unit_id' => $fulfillId ?? 0,
                    'year' => $year,
                    'month' => $month,
                    'order_count' => $item['order_fulfillments_count'] ?? 0,
                    'total_price' => $item['total_fulfill_price'] ?? 0,
                ];
            }

            FulfillmentStatistic::upsert(
                $upsertData,
                ['type', 'external_id', 'year', 'month', 'fulfill_unit_id'], // Unique constraint
                ['name', 'avatar', 'team_id', 'team_name', 'role_name', 'account_code', 'status_name', 'order_count', 'total_price'] // Update columns
            );
        } catch (\Exception $e) {
            $msg = "Sync failed for {$type} {$month}/{$year} Unit {$fulfillId}: " . $e->getMessage();
            $this->error("[" . now()->toDateTimeString() . "] " . $msg);
            Log::error("SYNC_FULFILLMENT_STATISTICS: {$msg}");
        }
    }
}
