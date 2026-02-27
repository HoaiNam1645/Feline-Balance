<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FelineService;
use App\Models\FulfillmentStatistic;
use App\Models\FulfillUnit;

class SyncFulfillmentStatistics extends Command
{
    protected $signature = 'sync:fulfillment-statistics {--year=} {--month=} {--all}';

    protected $description = 'Fetch fulfillment statistics and units from Feline API and save to local DB';

    public function handle(FelineService $felineService)
    {
        $this->syncFulfillUnits($felineService);

        $isAll = $this->option('all');
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

        foreach ($periodsToSync as $period) {
            foreach (['user', 'store'] as $type) {
                foreach ($unitIdsToSync as $fulfillId) {
                    $this->syncPeriodTypeUnit($felineService, $period['year'], $period['month'], $type, $fulfillId);
                }
            }
        }
    }

    private function syncFulfillUnits(FelineService $felineService)
    {
        $this->info("Syncing Fulfill Units...");
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
            $this->info("Synced " . count($upsertData) . " Fulfill Units.");
        } catch (\Exception $e) {
            $this->error("Failed to sync fulfill units: " . $e->getMessage());
        }
    }

    private function syncPeriodTypeUnit(FelineService $felineService, int $year, int $month, string $type, ?int $fulfillId)
    {
        $unitLabel = $fulfillId === null ? "TOTAL" : "Unit {$fulfillId}";
        $this->info("Syncing {$type} | {$month}/{$year} | {$unitLabel}");

        try {
            $result = $felineService->getFulfillmentStatistics($type, $year, $month, $fulfillId);
            $data = $result['data'] ?? [];

            if (empty($data)) {
                return; // Suppress "Empty" logs for specific units to keep console clean
            }

            $upsertData = [];

            foreach ($data as $item) {
                $teamName = null;
                $roleName = null;
                $accountCode = null;
                $statusName = null;
                $avatar = null;

                if ($type === 'user') {
                    $teamName = $item['user_detail']['team']['name'] ?? null;
                    $roleName = $item['role']['name'] ?? null;
                    $avatar = $item['avatar'] ?? null;
                } else {
                    // type === 'store'
                    $teamName = $item['user']['user_detail']['team']['name'] ?? null; // Usually null for stores based on Felineez API
                    $avatar = $item['user']['avatar'] ?? null;
                    $accountCode = $item['detail']['account_code'] ?? null;
                    $statusName = $item['status']['name'] ?? null;
                }

                $upsertData[] = [
                    'type' => $type,
                    'external_id' => $item['id'],
                    'name' => $item['name'] ?? ($item['store_name'] ?? 'Unknown'),
                    'avatar' => $avatar,
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
                ['name', 'avatar', 'team_name', 'role_name', 'account_code', 'status_name', 'order_count', 'total_price'] // Update columns
            );
        } catch (\Exception $e) {
            $this->error("Sync failed for {$type} {$month}/{$year} Unit {$fulfillId}: " . $e->getMessage());
        }
    }
}
