<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FelineService;
use App\Models\DesignStatistic;

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

        foreach ($periodsToSync as $period) {
            $this->syncPeriod($felineService, $period['year'], $period['month']);
        }
    }

    private function syncPeriod(FelineService $felineService, int $year, int $month)
    {
        $this->info("Starting sync for Design Statistics: {$month}/{$year}");

        try {
            $result = $felineService->getDesignStatistics($year, $month);
            $data = $result['data'] ?? [];

            if (empty($data)) {
                $this->info("No data returned from API for {$month}/{$year}.");
                return;
            }

            $upsertData = [];

            foreach ($data as $item) {
                $upsertData[] = [
                    'external_user_id' => $item['id'],
                    'user_name' => $item['name'] ?? 'Unknown User',
                    'user_avatar' => $item['avatar'] ?? null,
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
                ['user_name', 'user_avatar', 'team_name', 'role_name', 'print_count', 'embroidery_count', 'sticker_count', 'designs_count'] // Update columns
            );

            $count = count($upsertData);
            $this->info("Successfully synced {$count} records for {$month}/{$year}.");
        } catch (\Exception $e) {
            $this->error("Sync failed for {$month}/{$year}: " . $e->getMessage());
        }
    }
}
