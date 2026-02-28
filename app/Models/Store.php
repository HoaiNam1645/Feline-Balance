<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Store extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'account_no',
        'user_id',
        'status',
        'last_payment_date',
        'total_payments',
        'total_amount',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paymentHistories()
    {
        return $this->hasMany(PaymentHistory::class, 'store_id');
    }
}
