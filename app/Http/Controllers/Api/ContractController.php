<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContractController extends Controller
{
    /**
     * List contracts for an employee.
     */
    public function index(Request $request, string $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);
        $contracts = $employee->contracts()->orderBy('start_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $contracts,
        ]);
    }

    /**
     * Create a new contract for an employee.
     */
    public function store(Request $request, string $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $validated = $request->validate([
            'type' => 'required|in:probation,official',
            'salary' => 'required|numeric|min:0',
            'standard_work_days' => 'nullable|integer|min:1|max:31',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_current' => 'boolean',
        ]);

        $validated['employee_id'] = $employee->id;

        if (!isset($validated['standard_work_days'])) {
            $validated['standard_work_days'] = 27;
        }

        // If this is marked as current, unmark others
        if (!empty($validated['is_current'])) {
            $employee->contracts()->update(['is_current' => false]);
        }

        $contract = Contract::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contract created successfully.',
            'data' => $contract,
        ], 201);
    }

    /**
     * Update a contract.
     */
    public function update(Request $request, string $employeeId, string $contractId): JsonResponse
    {
        $contract = Contract::where('employee_id', $employeeId)->findOrFail($contractId);

        $validated = $request->validate([
            'type' => 'sometimes|in:probation,official',
            'salary' => 'sometimes|numeric|min:0',
            'standard_work_days' => 'nullable|integer|min:1|max:31',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date',
            'is_current' => 'boolean',
        ]);

        // If setting as current, unmark others
        if (!empty($validated['is_current'])) {
            Contract::where('employee_id', $employeeId)->where('id', '!=', $contractId)->update(['is_current' => false]);
        }

        $contract->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contract updated successfully.',
            'data' => $contract,
        ]);
    }

    /**
     * Delete a contract.
     */
    public function destroy(string $employeeId, string $contractId): JsonResponse
    {
        $contract = Contract::where('employee_id', $employeeId)->findOrFail($contractId);
        $contract->delete();

        return response()->json([
            'success' => true,
            'message' => 'Contract deleted successfully.',
        ]);
    }
}
