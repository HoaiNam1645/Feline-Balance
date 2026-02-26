<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'date_of_birth',
        'gender',
        'cccd',
        'hometown',
        'email',
        'phone',
        'avatar',
        'bank_code',
        'bank_name',
        'qr_code',
        'has_insurance',
        'insurance_number',
        'start_date',
        'end_date',
        'status',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'start_date' => 'date',
            'end_date' => 'date',
            'has_insurance' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function currentContract()
    {
        return $this->hasOne(Contract::class)->where('is_current', true)->latestOfMany();
    }

    public function payrolls()
    {
        return $this->hasMany(Payroll::class);
    }
}
