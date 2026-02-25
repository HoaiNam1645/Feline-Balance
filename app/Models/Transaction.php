<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_id',
        'type',
        'payment_method',
        'amount',
        'currency',
        'image',
        'status',
    ];
}
