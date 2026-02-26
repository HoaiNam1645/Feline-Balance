<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function profiles()
    {
        return $this->hasMany(Profile::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
