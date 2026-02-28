<?php

namespace App\Services;

use App\Models\Profile;

class ProfileService
{
    /**
     * Get a list of profiles with balances and settlements based on given filters.
     *
     * @param array $filters
     * @return array
     */
    public function getProfiles(array $filters): array
    {
        $query = Profile::query();

        if (!empty($filters['team_id'])) {
            $query->where('team_id', $filters['team_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $query->where('profile_name', 'like', '%' . $filters['search'] . '%');
        }

        $year = $filters['year'] ?? date('Y');

        // Aggregated totals queries
        $totalsQuery = clone $query;
        $totalsQuery->leftJoin('balances', 'profiles.id', '=', 'balances.profile_id');

        $settlementsQuery = clone $query;
        $settlementsQuery->join('monthly_settlements', 'profiles.id', '=', 'monthly_settlements.profile_id')
            ->where('monthly_settlements.month', '>=', $year . '-01')
            ->where('monthly_settlements.month', '<=', $year . '-12')
            ->selectRaw('monthly_settlements.month, SUM(monthly_settlements.settlement) as total')
            ->groupBy('monthly_settlements.month');

        $monthlyTotals = $settlementsQuery->pluck('total', 'month');

        $monthlySummary = [];
        for ($m = 1; $m <= 12; $m++) {
            $key = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
            $monthlySummary['t' . $m] = (float)($monthlyTotals[$key] ?? 0);
        }

        $summary = [
            'total_profiles'    => (clone $query)->count(),
            'total_net_earning' => (float)(clone $totalsQuery)->sum('balances.net_earning'),
            'total_on_hold'     => (float)(clone $totalsQuery)->sum('balances.on_hold_amount'),
            'total_paid'        => (float)(clone $totalsQuery)->sum('balances.total_paid'),
        ] + $monthlySummary;

        // Paginate results
        $perPage = $filters['per_page'] ?? 15;
        $paginator = $query->with(['balance', 'monthlySettlements', 'team'])
            ->select('profiles.*')
            ->orderBy('team_id')
            ->orderBy('profile_name')
            ->paginate($perPage);

        $data = collect($paginator->items())->map(function ($profile) use ($year) {
            $settlements = $profile->monthlySettlements
                ->where('month', '>=', $year . '-01')
                ->where('month', '<=', $year . '-12')
                ->keyBy('month');

            $monthly = [];
            for ($m = 1; $m <= 12; $m++) {
                $key = $year . '-' . str_pad($m, 2, '0', STR_PAD_LEFT);
                $monthly['t' . $m] = $settlements->has($key)
                    ? (float) $settlements[$key]->settlement
                    : 0;
            }

            return [
                'id'               => $profile->id,
                'profile_name'     => $profile->profile_name,
                'profile_code'     => $profile->profile_code,
                'seller_id'        => $profile->seller_id,
                'team_id'          => $profile->team_id,
                'team_name'        => $profile->team?->name ?? null,
                'status'           => $profile->status,
                'bank_last4'       => $profile->bank_last4,
                'beneficiary_name' => $profile->beneficiary_name,
                'seller_name'      => $profile->seller_name,
                'bank_full'        => $profile->bank_full,
                'fa_code'          => auth('api')->user() && in_array(auth('api')->user()->role->name ?? '', ['admin', 'super_admin']) ? $profile->fa_code : null,
                'has_2fa'          => !empty($profile->fa_code),
                'net_earning'      => $profile->balance ? (float) $profile->balance->net_earning : 0,
                'on_hold_amount'   => $profile->balance ? (float) $profile->balance->on_hold_amount : 0,
                'total_paid'       => $profile->balance ? (float) $profile->balance->total_paid : 0,
                ...$monthly,
            ];
        });

        return [
            'data'       => $data->values(),
            'summary'    => $summary,
            'year'       => (int)$year,
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ]
        ];
    }

    public function updateProfile(string $id, array $data): Profile
    {
        $profile = Profile::find($id);
        if (!$profile) {
            throw new \Exception('Profile not found', 404);
        }

        $fillableData = collect($data)->only([
            'profile_name',
            'profile_code',
            'seller_id',
            'team_id',
            'status',
            'bank_last4',
            'beneficiary_name',
            'seller_name',
            'bank_full',
            'fa_code',
        ])->toArray();

        $profile->update($fillableData);
        $profile->load(['balance', 'monthlySettlements']);

        return $profile;
    }
}
