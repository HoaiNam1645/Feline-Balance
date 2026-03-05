<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'transaction_id',
        'type',
        'team_id',
        'payment_method',
        'vendor_id',
        'company_id',
        'amount',
        'currency',
        'image',
        'status',
        'note',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
