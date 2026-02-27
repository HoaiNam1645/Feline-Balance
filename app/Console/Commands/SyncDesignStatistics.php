<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FelineService;
use App\Models\DesignStatistic;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SyncDesignStatistics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:design-statistics {--year=} {--month=} {--all}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch design statistics from Feline API and save to local DB';

    /**
     * Execute the console command.
     */
    public function handle(FelineService $felineService)
    {
        $isAll = $this->option('all');
        Log::info("SYNC_DESIGN_STATISTICS: Command started. [All: {$isAll}, Year: {$this->option('year')}, Month: {$this->option('month')}]");

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

            // Nếu đang là 5 ngày đầu của tháng mới, quét thêm tháng cũ để tránh sót data muộn
            if (now()->day <= 5 && !$this->option('year') && !$this->option('month')) {
                $prevMonth = now()->copy()->subMonth();
                $periodsToSync[] = ['year' => $prevMonth->year, 'month' => $prevMonth->month];
            }
        }

        $teamUserMap = DB::table('team_user')->pluck('team_id', 'user_id');

        foreach ($periodsToSync as $period) {
            $this->syncPeriod($felineService, $teamUserMap, $period['year'], $period['month']);
        }

        Log::info("SYNC_DESIGN_STATISTICS: Command completed successfully.");
    }

    private function syncPeriod(FelineService $felineService, $teamUserMap, int $year, int $month)
    {
        $this->info("[" . now()->toDateTimeString() . "] Starting sync for Design Statistics: {$month}/{$year}");

        try {
            $result = $felineService->getDesignStatistics($year, $month);
            $data = $result['data'] ?? [];

            if (empty($data)) {
                $this->info("[" . now()->toDateTimeString() . "] No data returned from API for {$month}/{$year}.");
                return;
            }

            $upsertData = [];

            foreach ($data as $item) {
                $userId = $item['id'];
                $upsertData[] = [
                    'external_user_id' => $userId,
                    'user_name' => $item['name'] ?? 'Unknown User',
                    'user_avatar' => $item['avatar'] ?? null,
                    'team_id' => $teamUserMap[$userId] ?? null,
                    'team_name' => $item['user_detail']['team']['name'] ?? null,
                    'role_name' => $item['role']['name'] ?? null,
                    'year' => $year,
                    'month' => $month,
                    'print_count' => $item['print_count'] ?? 0,
                    'embroidery_count' => $item['embroidery_count'] ?? 0,
                    'sticker_count' => $item['sticker_count'] ?? 0,
                    'designs_count' => $item['designs_count'] ?? 0,
                ];
            }

            DesignStatistic::upsert(
                $upsertData,
                ['external_user_id', 'year', 'month'], // Unique columns
                ['user_name', 'user_avatar', 'team_id', 'team_name', 'role_name', 'print_count', 'embroidery_count', 'sticker_count', 'designs_count'] // Update columns
            );

            $count = count($upsertData);
            $this->info("[" . now()->toDateTimeString() . "] Successfully synced {$count} records for {$month}/{$year}.");
            Log::info("SYNC_DESIGN_STATISTICS: Successfully synced {$count} records for {$month}/{$year}.");
        } catch (\Exception $e) {
            $msg = "Sync failed for {$month}/{$year}: " . $e->getMessage();
            $this->error("[" . now()->toDateTimeString() . "] " . $msg);
            Log::error("SYNC_DESIGN_STATISTICS: {$msg}");
        }
    }
}
