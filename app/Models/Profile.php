<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'profile_name',
        'profile_code',
        'seller_id',
        'team',
        'status',
        'bank_last4',
        'beneficiary_name',
    ];

    public function balance()
    {
        return $this->hasOne(Balance::class, 'profile_id', 'id');
    }

    public function monthlySettlements()
    {
        return $this->hasMany(MonthlySettlement::class, 'profile_id', 'id');
    }

    public function fetchLogs()
    {
        return $this->hasMany(FetchLog::class, 'profile_id', 'id');
    }
}
