<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FetchLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'profile_id',
        'status',
        'error_message',
        'duration_ms',
    ];

    public function profile()
    {
        return $this->belongsTo(Profile::class, 'profile_id', 'id');
    }
}
