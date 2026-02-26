<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PayrollController extends Controller
{
    /**
     * List payrolls with filters (month, year, employee, status).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payroll::with(['employee', 'contract']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->filled('month')) {
            $query->where('month', $request->month);
        }
        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('min_salary')) {
            $query->where('net_salary', '>=', $request->min_salary);
        }
        if ($request->filled('max_salary')) {
            $query->where('net_salary', '<=', $request->max_salary);
        }
        if ($request->filled('work_days')) {
            $query->where('work_days', $request->work_days);
        }
        if ($request->filled('paid_leave_days')) {
            $query->where('paid_leave_days', $request->paid_leave_days);
        }
        if ($request->filled('unpaid_leave_days')) {
            $query->where('unpaid_leave_days', $request->unpaid_leave_days);
        }

        $payrolls = $query->orderBy('year', 'desc')->orderBy('month', 'desc')->paginate($request->get('per_page', 20));

        // Summary
        $summaryQuery = Payroll::query();
        if ($request->filled('month')) $summaryQuery->where('month', $request->month);
        if ($request->filled('year')) $summaryQuery->where('year', $request->year);

        $summary = [
            'total_net_salary' => $summaryQuery->sum('net_salary'),
            'total_bonus' => $summaryQuery->sum('bonus'),
            'total_penalty' => $summaryQuery->sum('penalty'),
            'total_insurance' => $summaryQuery->sum('insurance_deduction'),
            'completed_count' => (clone $summaryQuery)->where('payment_status', 'completed')->count(),
            'pending_count' => (clone $summaryQuery)->where('payment_status', 'pending')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'payrolls' => $payrolls,
                'summary' => $summary,
            ],
        ]);
    }

    /**
     * Create or update a payroll entry.
     * Auto-calculates insurance_deduction and net_salary.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'contract_id' => 'required|exists:contracts,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2099',
            'work_days' => 'required|numeric|min:0|max:31',
            'paid_leave_days' => 'nullable|numeric|min:0|max:31',
            'unpaid_leave_days' => 'nullable|numeric|min:0|max:31',
            'bonus' => 'nullable|numeric|min:0',
            'penalty' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:pending,completed',
            'note' => 'nullable|string',
        ]);

        $validated['paid_leave_days'] = $validated['paid_leave_days'] ?? 0;
        $validated['unpaid_leave_days'] = $validated['unpaid_leave_days'] ?? 0;
        $validated['bonus'] = $validated['bonus'] ?? 0;
        $validated['penalty'] = $validated['penalty'] ?? 0;
        $validated['payment_status'] = $validated['payment_status'] ?? 'pending';

        $payroll = Payroll::updateOrCreate(
            [
                'employee_id' => $validated['employee_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            $validated
        );

        // Auto-calculate
        $payroll->calculateSalary();
        $payroll->save();

        $payroll->load(['employee', 'contract']);

        return response()->json([
            'success' => true,
            'message' => 'Payroll saved successfully.',
            'data' => $payroll,
        ], 201);
    }

    /**
     * Update payroll.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $payroll = Payroll::findOrFail($id);

        $validated = $request->validate([
            'contract_id' => 'sometimes|exists:contracts,id',
            'work_days' => 'sometimes|numeric|min:0|max:31',
            'paid_leave_days' => 'nullable|numeric|min:0|max:31',
            'unpaid_leave_days' => 'nullable|numeric|min:0|max:31',
            'bonus' => 'nullable|numeric|min:0',
            'penalty' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:pending,completed',
            'note' => 'nullable|string',
        ]);

        $payroll->fill($validated);
        $payroll->calculateSalary();
        $payroll->save();

        $payroll->load(['employee', 'contract']);

        return response()->json([
            'success' => true,
            'message' => 'Payroll updated successfully.',
            'data' => $payroll,
        ]);
    }

    /**
     * Delete payroll.
     */
    public function destroy(string $id): JsonResponse
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();

        return response()->json([
            'success' => true,
            'message' => 'Payroll deleted successfully.',
        ]);
    }

    /**
     * Generate payroll entries for all active employees for a given month/year.
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2099',
        ]);

        $month = $request->month;
        $year = $request->year;

        $employees = Employee::where('status', 'active')
            ->whereHas('currentContract')
            ->with('currentContract')
            ->get();

        $created = 0;
        foreach ($employees as $emp) {
            $contract = $emp->currentContract;
            if (!$contract) continue;

            // Skip if already exists
            $exists = Payroll::where('employee_id', $emp->id)
                ->where('month', $month)
                ->where('year', $year)
                ->exists();

            if ($exists) continue;

            $payroll = new Payroll([
                'employee_id' => $emp->id,
                'contract_id' => $contract->id,
                'month' => $month,
                'year' => $year,
                'work_days' => $contract->standard_work_days,
                'paid_leave_days' => 0,
                'unpaid_leave_days' => 0,
                'bonus' => 0,
                'penalty' => 0,
                'payment_status' => 'pending',
            ]);

            $payroll->calculateSalary();
            $payroll->save();
            $created++;
        }

        return response()->json([
            'success' => true,
            'message' => "Generated {$created} payroll entries for {$month}/{$year}.",
            'data' => ['created' => $created],
        ]);
    }
}
