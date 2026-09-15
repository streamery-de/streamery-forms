<?php

/**
 * Class Entries
 *
 * Represents the Entries model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class Entries
 *
 * Represents the Entries model for Streamery Forms.
 *
 * @package StreameryForms\Models
 */
class Entries extends Model
{

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'streamery_forms_entries';

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
        'mailbox_id',
        'form_identifier',
        'wp_post_id',
        'data',
        'ip_address',
        'is_read',
        'status',
        'subject',
        'from_mail',
        'date_created',
        'folder_id',
    );

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = array(
        'data'        => 'array',
        'is_read'     => 'boolean',
        //'date_created' => 'datetime',
    );

    /**
     * The storage format of the model's date fields.
     *
     * @var string
     */
    protected $dateFormat = 'Y-m-d H:i:s';

    /**
     * Prepare a date for array / JSON serialization.
     * Output as ISO 8601 with WordPress timezone so the frontend parses correctly.
     *
     * @param  mixed  $date
     * @return string
     */
    protected function serializeDate($date)
    {
        $raw = $this->getRawOriginal('date_created');
        if ($raw === null || $raw === '') {
            $raw = isset($this->attributes['date_created']) ? $this->attributes['date_created'] : null;
        }
        if ($raw === null || $raw === '') {
            return $date instanceof \DateTimeInterface ? $date->format('Y-m-d H:i:s') : (string) $date;
        }
        // Interpret stored value as WordPress local time and output ISO 8601 with timezone
        $tz = function_exists('wp_timezone') ? wp_timezone() : new \DateTimeZone('UTC');
        try {
            $dt = new \DateTime($raw, $tz);
            return $dt->format('c');
        } catch (\Exception $e) {
            return $date instanceof \DateTimeInterface ? $date->format('Y-m-d H:i:s') : (string) $raw;
        }
    }

    /**
     * Get the mailbox that owns the entry.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function mailbox()
    {
        return $this->belongsTo(Mailboxes::class, 'mailbox_id');
    }

    /**
     * Get the folder that owns the entry (optional).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function folder()
    {
        return $this->belongsTo(InboxFolder::class, 'folder_id');
    }

    /**
     * Get the labels for the entry.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function labels()
    {
        return $this->belongsToMany(
            EntryLabels::class,
            'streamery_forms_entry_label_rel',
            'entry_id',
            'label_id'
        );
    }
}
