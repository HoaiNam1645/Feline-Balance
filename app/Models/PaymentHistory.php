<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentHistory extends Model
{
    protected $fillable = [
        'store_id',
        'transaction_date',
        'currency',
        'amount',
        'transaction_id',
        'account_no',
        'fee',
        'rate',
        'net',
        'type',
        'from_to',
        'status',
        'description',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
