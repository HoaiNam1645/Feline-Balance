<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'type',
        'salary',
        'standard_work_days',
        'start_date',
        'end_date',
        'is_current',
    ];

    protected function casts(): array
    {
        return [
            'salary' => 'decimal:0',
            'start_date' => 'date',
            'end_date' => 'date',
            'is_current' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}
