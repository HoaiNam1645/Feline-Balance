<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FulfillUnit extends Model
{
    public $incrementing = false;
    protected $fillable = [
        'id',
        'name',
        'classname',
        'status'
    ];
}
