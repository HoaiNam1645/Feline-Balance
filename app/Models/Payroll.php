<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'contract_id',
        'month',
        'year',
        'work_days',
        'paid_leave_days',
        'unpaid_leave_days',
        'insurance_deduction',
        'bonus',
        'penalty',
        'net_salary',
        'payment_status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'work_days' => 'decimal:1',
            'paid_leave_days' => 'decimal:1',
            'unpaid_leave_days' => 'decimal:1',
            'insurance_deduction' => 'decimal:0',
            'bonus' => 'decimal:0',
            'penalty' => 'decimal:0',
            'net_salary' => 'decimal:0',
        ];
    }

    // ── Relationships ──

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    // ── Auto-calculate ──

    /**
     * Calculate and fill insurance_deduction + net_salary based on contract.
     */
    public function calculateSalary(): void
    {
        $contract = $this->contract ?? Contract::find($this->contract_id);
        if (!$contract) return;

        $salary = (float) $contract->salary;
        $standardDays = (int) $contract->standard_work_days ?: 27;

        // BHXH deduction (only if employee has insurance)
        $employee = $this->employee ?? Employee::find($this->employee_id);
        $insuranceRate = ($employee && $employee->has_insurance) ? 0.105 : 0;
        $this->insurance_deduction = round($salary * $insuranceRate);

        // Lương theo ngày công = (Lương HĐ / Ngày công chuẩn) × (Ngày công thực tế + Nghỉ phép có lương)
        $effectiveDays = (float) $this->work_days + (float) $this->paid_leave_days;
        $dailySalary = $salary / $standardDays;
        $grossByDays = round($dailySalary * $effectiveDays);

        // Lương thực nhận = Lương theo ngày công − BHXH + Thưởng − Phạt
        $this->net_salary = $grossByDays - $this->insurance_deduction + (float) $this->bonus - (float) $this->penalty;
    }
}
