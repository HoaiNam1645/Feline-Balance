<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\IOFactory;

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

        // Filter by join_month (YYYY-MM)
        if ($request->filled('join_month')) {
            $parts = explode('-', $request->join_month);
            if (count($parts) === 2) {
                $query->whereYear('start_date', $parts[0])
                    ->whereMonth('start_date', $parts[1]);
            }
        }

        // Calculate summary based on current filters
        $summaryQuery = clone $query;
        $totalResigned = (clone $summaryQuery)->where('status', 'resigned')->count();
        $totalActive = (clone $summaryQuery)->where('status', 'active')->count();

        $totalOfficial = (clone $summaryQuery)->whereHas('currentContract', function ($q) {
            $q->where('type', 'official');
        })->where('status', 'active')->count();

        $totalProbation = (clone $summaryQuery)->whereHas('currentContract', function ($q) {
            $q->where('type', 'probation');
        })->where('status', 'active')->count();

        $employees = $query->orderBy('id', 'desc')->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $employees,
            'summary' => [
                'resigned' => $totalResigned,
                'active' => $totalActive,
                'official' => $totalOfficial,
                'probation' => $totalProbation,
            ]
        ]);
    }

    /**
     * Store a new employee.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'team' => 'nullable|string|max:255',
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
            'team' => 'nullable|string|max:255',
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

    /**
     * Import employees from XLSX.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:5120',
        ]);

        $file = $request->file('file');

        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to read Excel file: ' . $e->getMessage(),
            ], 422);
        }

        $empSheet = $spreadsheet->getSheetByName('Employees') ?? $spreadsheet->getSheet(0);
        $contractSheet = $spreadsheet->getSheetByName('Contracts');

        $empData = $empSheet->toArray(null, true, true, false);
        $contractData = $contractSheet ? $contractSheet->toArray(null, true, true, false) : [];

        if (count($empData) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'The Employees sheet must have a header row and at least one data row.',
            ], 422);
        }

        $empHeader = array_map(fn($h) => strtolower(trim((string) $h)), $empData[0]);
        $contractHeader = [];
        if (count($contractData) > 0) {
            $contractHeader = array_map(fn($h) => strtolower(trim((string) $h)), $contractData[0]);
        }

        // Group contracts by ref_id
        $contractsByRef = [];
        for ($i = 1; $i < count($contractData); $i++) {
            $line = $contractData[$i];
            if (count(array_filter($line, fn($v) => $v !== null && $v !== '')) === 0) continue;

            $row = array_combine($contractHeader, array_map(fn($v) => (string) ($v ?? ''), $line));
            $refId = trim($row['employee_ref_id'] ?? '');
            if ($refId !== '') {
                // Ensure correct field names mapping
                $contractsByRef[$refId][] = [
                    'type' => strtolower(trim($row['type'] ?? 'probation')),
                    'salary' => trim($row['salary'] ?? '0'),
                    'standard_work_days' => !empty($row['standard_work_days']) ? (int) $row['standard_work_days'] : 27,
                    'start_date' => !empty($row['start_date']) ? trim($row['start_date']) : null,
                    'end_date' => !empty($row['end_date']) ? trim($row['end_date']) : null,
                    'is_current' => strtolower(trim($row['is_current'] ?? '')) === 'yes',
                ];
            }
        }

        $created = 0;
        $errors = [];

        for ($i = 1; $i < count($empData); $i++) {
            $rowNumber = $i + 1;
            $line = $empData[$i];
            if (count(array_filter($line, fn($v) => $v !== null && $v !== '')) === 0) continue;

            $row = array_combine($empHeader, array_map(fn($v) => (string) ($v ?? ''), $line));

            $refId = trim($row['ref_id'] ?? '');

            $data = [
                'name'             => trim($row['name'] ?? ''),
                'date_of_birth'    => !empty($row['date_of_birth']) ? trim($row['date_of_birth']) : null,
                'gender'           => !empty($row['gender']) ? strtolower(trim($row['gender'])) : 'male',
                'cccd'             => !empty($row['cccd']) ? trim($row['cccd']) : null,
                'hometown'         => !empty($row['hometown']) ? trim($row['hometown']) : null,
                'email'            => !empty($row['email']) ? trim($row['email']) : null,
                'phone'            => !empty($row['phone']) ? trim($row['phone']) : null,
                'bank_code'        => !empty($row['bank_code']) ? trim($row['bank_code']) : null,
                'bank_name'        => !empty($row['bank_name']) ? trim($row['bank_name']) : null,
                'has_insurance'    => in_array(strtolower(trim($row['has_insurance'] ?? '')), ['1', 'true', 'yes']),
                'insurance_number' => !empty($row['insurance_number']) ? trim($row['insurance_number']) : null,
                'start_date'       => !empty($row['start_date']) ? trim($row['start_date']) : null,
                'end_date'         => !empty($row['end_date']) ? trim($row['end_date']) : null,
                'status'           => !empty($row['status']) ? strtolower(trim($row['status'])) : 'active',
                'note'             => !empty($row['note']) ? trim($row['note']) : null,
            ];

            $validator = Validator::make($data, [
                'name'             => 'required|string|max:255',
                'date_of_birth'    => 'nullable|date',
                'gender'           => 'nullable|in:male,female,other',
                'cccd'             => 'nullable|string|max:20|unique:employees,cccd',
                'hometown'         => 'nullable|string|max:255',
                'email'            => 'nullable|string|email|max:255',
                'phone'            => 'nullable|string|max:20',
                'bank_code'        => 'nullable|string|max:255',
                'bank_name'        => 'nullable|string|max:255',
                'has_insurance'    => 'boolean',
                'insurance_number' => 'nullable|string|max:50',
                'start_date'       => 'nullable|date',
                'end_date'         => 'nullable|date',
                'status'           => 'nullable|in:active,resigned',
                'note'             => 'nullable|string',
            ]);

            if ($validator->fails()) {
                $errors[] = "Row {$rowNumber} ({$data['name']}): " . implode(', ', $validator->errors()->all());
                continue;
            }

            try {
                DB::transaction(function () use ($data, $refId, $contractsByRef) {
                    $employee = Employee::create($data);

                    if ($refId !== '' && isset($contractsByRef[$refId])) {
                        foreach ($contractsByRef[$refId] as $c) {
                            $employee->contracts()->create([
                                'type' => in_array($c['type'], ['probation', 'official']) ? $c['type'] : 'probation',
                                'salary' => (float) $c['salary'],
                                'standard_work_days' => $c['standard_work_days'],
                                'start_date' => $c['start_date'] ?? ($data['start_date'] ?? now()->format('Y-m-d')),
                                'end_date' => $c['end_date'],
                                'is_current' => $c['is_current'],
                            ]);
                        }
                    }
                });
                $created++;
            } catch (\Exception $e) {
                $errors[] = "Row {$rowNumber} ({$data['name']}): " . $e->getMessage();
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Imported {$created} employee(s) successfully." . (count($errors) > 0 ? ' Some rows had errors.' : ''),
            'data' => [
                'created' => $created,
                'total_rows' => count($empData) - 1,
                'errors' => $errors,
            ],
        ]);
    }

    /**
     * Export employees to XLSX.
     */
    public function export(Request $request)
    {
        $query = Employee::with('contracts');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('name')) {
            $query->where('name', 'like', "%{$request->name}%");
        }

        $employees = $query->orderBy('id', 'desc')->get();

        $spreadsheet = new Spreadsheet();

        // Sheet 1: Employees
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Employees');

        $sheet1->fromArray([
            'ref_id',
            'name',
            'date_of_birth',
            'gender',
            'cccd',
            'hometown',
            'email',
            'phone',
            'bank_code',
            'bank_name',
            'has_insurance',
            'insurance_number',
            'start_date',
            'end_date',
            'status',
            'note'
        ], null, 'A1');

        $rowNum1 = 2;
        foreach ($employees as $emp) {
            $sheet1->fromArray([
                $emp->id,
                $emp->name,
                $emp->date_of_birth ? $emp->date_of_birth->format('Y-m-d') : '',
                $emp->gender,
                $emp->cccd,
                $emp->hometown,
                $emp->email,
                $emp->phone,
                $emp->bank_code,
                $emp->bank_name,
                $emp->has_insurance ? 'yes' : 'no',
                $emp->insurance_number,
                $emp->start_date ? $emp->start_date->format('Y-m-d') : '',
                $emp->end_date ? $emp->end_date->format('Y-m-d') : '',
                $emp->status,
                $emp->note,
            ], null, 'A' . $rowNum1++);
        }

        // Sheet 2: Contracts
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Contracts');

        $sheet2->fromArray([
            'employee_ref_id',
            'type',
            'salary',
            'standard_work_days',
            'start_date',
            'end_date',
            'is_current'
        ], null, 'A1');

        $rowNum2 = 2;
        foreach ($employees as $emp) {
            foreach ($emp->contracts as $contract) {
                $sheet2->fromArray([
                    $emp->id,
                    $contract->type,
                    $contract->salary,
                    $contract->standard_work_days,
                    $contract->start_date ? $contract->start_date->format('Y-m-d') : '',
                    $contract->end_date ? $contract->end_date->format('Y-m-d') : '',
                    $contract->is_current ? 'yes' : 'no',
                ], null, 'A' . $rowNum2++);
            }
        }

        $writer = new Xlsx($spreadsheet);
        $fileName = 'employees_' . date('Y-m-d_His') . '.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), 'export');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Download template for XLSX Import.
     */
    public function template()
    {
        $spreadsheet = new Spreadsheet();

        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Employees');
        $sheet1->fromArray([
            'ref_id',
            'name',
            'date_of_birth',
            'gender',
            'cccd',
            'hometown',
            'email',
            'phone',
            'bank_code',
            'bank_name',
            'has_insurance',
            'insurance_number',
            'start_date',
            'end_date',
            'status',
            'note'
        ], null, 'A1');
        $sheet1->fromArray([
            'EMP01',
            'John Doe',
            '1995-06-15',
            'male',
            '012345678901',
            'Hanoi',
            'john@email.com',
            '0901234567',
            '9876543210',
            'Vietcombank',
            'yes',
            'BH123456',
            '2024-01-15',
            '',
            'active',
            'New hire'
        ], null, 'A2');

        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Contracts');
        $sheet2->fromArray([
            'employee_ref_id',
            'type',
            'salary',
            'standard_work_days',
            'start_date',
            'end_date',
            'is_current'
        ], null, 'A1');
        $sheet2->fromArray([
            'EMP01',
            'probation',
            '8000000',
            '27',
            '2024-01-15',
            '2024-03-15',
            'no'
        ], null, 'A2');
        $sheet2->fromArray([
            'EMP01',
            'official',
            '10000000',
            '27',
            '2024-03-16',
            '',
            'yes'
        ], null, 'A3');

        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'export');
        $writer->save($tempFile);

        return response()->download($tempFile, 'employee_import_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
