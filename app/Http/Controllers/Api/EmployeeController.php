<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    /**
     * List employees with search, filter, pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Employee::with(['currentContract', 'contracts' => function ($q) {
            $q->orderBy('start_date', 'desc');
        }]);

        // Filters
        if ($request->filled('name')) {
            $query->where('name', 'like', "%{$request->name}%");
        }
        if ($request->filled('phone')) {
            $query->where('phone', 'like', "%{$request->phone}%");
        }
        if ($request->filled('cccd')) {
            $query->where('cccd', 'like', "%{$request->cccd}%");
        }
        if ($request->filled('email')) {
            $query->where('email', 'like', "%{$request->email}%");
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $employees = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * Store a new employee.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'cccd' => 'nullable|string|max:20|unique:employees,cccd',
            'hometown' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'bank_code' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'qr_code' => 'nullable|string',
            'has_insurance' => 'boolean',
            'insurance_number' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|in:active,resigned',
            'note' => 'nullable|string',
            'contracts' => 'nullable|array',
            'contracts.*.type' => 'required_with:contracts|in:probation,official',
            'contracts.*.salary' => 'required_with:contracts|numeric|min:0',
            'contracts.*.standard_work_days' => 'nullable|integer|min:1|max:31',
            'contracts.*.start_date' => 'required_with:contracts|date',
            'contracts.*.end_date' => 'nullable|date',
            'contracts.*.is_current' => 'boolean',
        ]);

        $employee = DB::transaction(function () use ($validated) {
            $emp = Employee::create($validated);

            if (!empty($validated['contracts'])) {
                foreach ($validated['contracts'] as $contractData) {
                    $contractData['standard_work_days'] = $contractData['standard_work_days'] ?? 27;
                    $emp->contracts()->create($contractData);
                }
            }

            return $emp;
        });

        $employee->load('currentContract');

        return response()->json([
            'success' => true,
            'message' => 'Employee created successfully.',
            'data' => $employee,
        ], 201);
    }

    /**
     * Show single employee with contracts & payrolls.
     */
    public function show(string $id): JsonResponse
    {
        $employee = Employee::with(['contracts' => fn($q) => $q->orderBy('start_date', 'desc'), 'payrolls' => fn($q) => $q->orderBy('year', 'desc')->orderBy('month', 'desc')])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $employee,
        ]);
    }

    /**
     * Update employee.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'cccd' => ['nullable', 'string', 'max:20', \Illuminate\Validation\Rule::unique('employees')->ignore($employee->id)],
            'hometown' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:255',
            'phone' => 'nullable|string|max:20',
            'bank_code' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'qr_code' => 'nullable|string',
            'has_insurance' => 'boolean',
            'insurance_number' => 'nullable|string|max:50',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'status' => 'nullable|in:active,resigned',
            'note' => 'nullable|string',
            'contracts' => 'nullable|array',
            'contracts.*.id' => 'nullable',
            'contracts.*.type' => 'required_with:contracts|in:probation,official',
            'contracts.*.salary' => 'required_with:contracts|numeric|min:0',
            'contracts.*.standard_work_days' => 'nullable|integer|min:1|max:31',
            'contracts.*.start_date' => 'required_with:contracts|date',
            'contracts.*.end_date' => 'nullable|date',
            'contracts.*.is_current' => 'boolean',
        ]);

        DB::transaction(function () use ($employee, $validated) {
            $employee->update($validated);

            if (isset($validated['contracts'])) {
                $existingIds = collect($validated['contracts'])->pluck('id')->filter()->toArray();
                // Find contracts that are in DB but NOT in the incoming array.
                $employee->contracts()->whereNotIn('id', $existingIds)->delete();

                foreach ($validated['contracts'] as $contractData) {
                    $contractData['standard_work_days'] = $contractData['standard_work_days'] ?? 27;
                    if (!empty($contractData['id'])) {
                        $employee->contracts()->where('id', $contractData['id'])->update($contractData);
                    } else {
                        $employee->contracts()->create($contractData);
                    }
                }
            }
        });

        $employee->load('currentContract');

        return response()->json([
            'success' => true,
            'message' => 'Employee updated successfully.',
            'data' => $employee,
        ]);
    }

    /**
     * Delete employee.
     */
    public function destroy(string $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully.',
        ]);
    }
}
