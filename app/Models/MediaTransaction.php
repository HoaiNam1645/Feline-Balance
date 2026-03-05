<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class MediaTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'team_id',
        'expense_type',
        'image',
        'transaction_code',
        'bank',
        'transaction_date',
        'amount',
        'status',
        'note',
    ];

    protected $casts = [
        'transaction_date' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}
