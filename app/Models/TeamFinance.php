<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamFinance extends Model
{
    protected $fillable = [
        'name',
        'description',
        'team_leader',
    ];

    public function leader()
    {
        return $this->belongsTo(User::class, 'team_leader');
    }

    public function members()
    {
        return $this->hasMany(User::class, 'team_finance_id');
    }
}
