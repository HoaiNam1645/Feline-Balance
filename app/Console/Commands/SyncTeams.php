<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\FelineService;
use App\Models\Team;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class SyncTeams extends Command
{
    protected $signature = 'sync:teams';

    protected $description = 'Sync teams and their members from Feline API';

    public function handle(FelineService $felineService)
    {
        Log::info("SYNC_TEAMS: Command started.");
        $this->info("Fetching Teams from Feline API...");

        try {
            $result = $felineService->getTeams();
            $data = $result['data'] ?? [];

            if (empty($data)) {
                $this->info("No data returned from API.");
                Log::info("SYNC_TEAMS: No data returned from API.");
                return;
            }

            $teamsUpsertData = [];
            $teamUsersData = [];

            foreach ($data as $item) {
                $teamsUpsertData[] = [
                    'name' => $item['name'],
                    'feline_id' => $item['id'],
                    'code' => $item['code'] ?? null,
                    'manager_id' => $item['manager_id'] ?? null,
                    'description' => $item['description'] ?? null,
                    'is_active' => ($item['status'] === 'active') ? 1 : 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Upsert teams using 'name' as unique key (from existing migrations)
            Team::upsert($teamsUpsertData, ['name'], ['feline_id', 'code', 'manager_id', 'description', 'is_active', 'updated_at']);

            // Now map team users
            // First we need local Team IDs mapping because team_user uses local team_id
            $localTeams = Team::all()->keyBy('name');

            foreach ($data as $item) {
                if (!isset($localTeams[$item['name']])) continue;
                $localTeamId = $localTeams[$item['name']]->id;

                if (isset($item['users']) && is_array($item['users'])) {
                    foreach ($item['users'] as $u) {
                        $teamUsersData[] = [
                            'team_id' => $localTeamId,
                            'user_id' => $u['id'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
            }

            // Syncing team_user pivot
            DB::transaction(function () use ($teamUsersData, $localTeams) {
                // Clear existing synced data first because Feline API provides full team snapshot
                DB::table('team_user')->delete();

                if (!empty($teamUsersData)) {
                    // Chucking in case of large dataset
                    $chunks = array_chunk($teamUsersData, 1000);
                    foreach ($chunks as $chunk) {
                        DB::table('team_user')->insert($chunk);
                    }
                }
            });

            $teamCount = count($teamsUpsertData);
            $userCount = count($teamUsersData);

            $this->info("Successfully synced {$teamCount} teams and {$userCount} team user relations.");
            Log::info("SYNC_TEAMS: Successfully synced {$teamCount} teams and {$userCount} relations.");
        } catch (\Exception $e) {
            $msg = "Failed to sync Teams: " . $e->getMessage();
            $this->error($msg);
            Log::error("SYNC_TEAMS: {$msg}");
        }
    }
}
