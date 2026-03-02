<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TwoFaLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'profile_id',
        'profile_name',
        'action',
        'success',
    ];

    protected $casts = [
        'success' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function profile()
    {
        return $this->belongsTo(Profile::class);
    }
}
