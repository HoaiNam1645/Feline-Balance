<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TeamFinance;
use App\Models\User;

class TeamFinanceController extends Controller
{
    public function index()
    {
        $teams = TeamFinance::with(['leader', 'members'])->get();
        return response()->json($teams);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'team_leader' => 'nullable|exists:users,id',
        ]);

        $team = TeamFinance::create($request->all());

        return response()->json($team->load(['leader', 'members']), 201);
    }

    public function show($id)
    {
        $team = TeamFinance::with(['leader', 'members'])->findOrFail($id);
        return response()->json($team);
    }

    public function update(Request $request, $id)
    {
        $team = TeamFinance::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'team_leader' => 'nullable|exists:users,id',
        ]);

        $team->update($request->all());

        return response()->json($team->load(['leader', 'members']));
    }

    public function destroy($id)
    {
        $team = TeamFinance::findOrFail($id);

        // Remove members' assignment
        User::where('team_finance_id', $team->id)->update(['team_finance_id' => null]);

        $team->delete();

        return response()->json(['message' => 'Team deleted successfully']);
    }

    public function assignMembers(Request $request, $id)
    {
        $team = TeamFinance::findOrFail($id);

        $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        // Option 1: Replace all members (Sync)
        // User::where('team_finance_id', $team->id)->update(['team_finance_id' => null]);
        // User::whereIn('id', $request->user_ids)->update(['team_finance_id' => $team->id]);

        // Option 2: Just add members to the team (keeping existing)
        User::whereIn('id', $request->user_ids)->update(['team_finance_id' => $team->id]);

        return response()->json($team->load(['leader', 'members']));
    }

    public function removeMember($id, $userId)
    {
        $team = TeamFinance::findOrFail($id);

        $user = User::findOrFail($userId);
        if ($user->team_finance_id == $team->id) {
            $user->update(['team_finance_id' => null]);
        }

        return response()->json($team->load(['leader', 'members']));
    }
}
