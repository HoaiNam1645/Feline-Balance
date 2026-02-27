<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FulfillmentStatistic extends Model
{
    protected $fillable = [
        'type',
        'external_id',
        'name',
        'avatar',
        'team_name',
        'role_name',
        'account_code',
        'status_name',
        'fulfill_unit_id',
        'year',
        'month',
        'order_count',
        'total_price'
    ];
}
