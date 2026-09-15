<?php

/**
 * Class EmailLogs
 *
 * Represents the EmailLogs model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class EmailLogs
 *
 * Represents the EmailLogs model for Streamery Forms.
 *
 * @package StreameryForms\Models
 */
class EmailLogs extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'streamery_forms_email_logs';

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'id';

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = true;

    const CREATED_AT = 'date_created';
    const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = array(
        'to_email',
        'subject',
        'message',
        'headers',
        'attachments',
        'from_email',
        'from_name',
        'status',
        'error_message',
        'date_sent',
        'date_created',
    );

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = array(
        'headers' => 'array',
        'attachments' => 'array',
        'date_sent' => 'datetime',
        'date_created' => 'datetime',
    );

    /**
     * The storage format of the model's date fields.
     *
     * @var string
     */
    protected $dateFormat = 'Y-m-d H:i:s';

    /**
     * Prepare a date for array / JSON serialization.
     *
     * @param  mixed  $date
     * @return string
     */
    protected function serializeDate($date)
    {
        if ($date instanceof \DateTimeInterface) {
            return $date->format('Y-m-d H:i:s');
        }
        return $date;
    }
}
