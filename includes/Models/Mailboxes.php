<?php

/**
 * Class Mailboxes
 *
 * Represents the Mailboxes model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class Mailboxes
 *
 * Represents the Mailboxes model for Streamery Forms.
 *
 * @package StreameryForms\Models
 */
class Mailboxes extends Model
{

	/**
	 * The table associated with the model.
	 *
	 * @var string
	 */
	protected $table = 'streamery_forms_mailboxes';

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
	public $timestamps = false;

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var array
	 */
	protected $fillable = array(
		'title',
		'is_default',
		'date_created',
		'user_id',
	);

	/**
	 * The attributes that should be cast.
	 *
	 * @var array
	 */
	protected $casts = array(
		'is_default'  => 'boolean',
		'date_created' => 'datetime',
	);

	/**
	 * Get the entries for the mailbox.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function entries()
	{
		return $this->hasMany(Entries::class, 'mailbox_id');
	}
}
