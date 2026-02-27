<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesignStatistic extends Model
{
    protected $fillable = [
        'external_user_id',
        'user_name',
        'user_avatar',
        'team_name',
        'role_name',
        'year',
        'month',
        'print_count',
        'embroidery_count',
        'sticker_count',
        'designs_count'
    ];
}
