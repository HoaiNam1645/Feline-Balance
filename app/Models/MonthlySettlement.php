<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlySettlement extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'profile_id',
        'month',
        'settlement',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }
}
