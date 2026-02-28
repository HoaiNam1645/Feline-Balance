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
        'team_id',
        'status',
        'bank_last4',
        'beneficiary_name',
        'seller_name',
        'bank_full',
        'fa_code',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

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
