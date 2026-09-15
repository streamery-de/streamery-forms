<?php

/**
 * Class EntryLabels
 *
 * Represents the EntryLabels model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class EntryLabels
 *
 * Represents the EntryLabels model for Streamery Forms.
 *
 * @package StreameryForms\Models
 */
class EntryLabels extends Model
{

	/**
	 * The table associated with the model.
	 *
	 * @var string
	 */
	protected $table = 'streamery_forms_entry_labels';

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
		'name',
		'description',
		'color',
		'date_created',
	);

	/**
	 * The attributes that should be cast.
	 *
	 * @var array
	 */
	protected $casts = array(
		'date_created' => 'datetime',
	);

	/**
	 * Get the entries that have this label.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function entries()
	{
		return $this->belongsToMany(
			Entries::class,
			'streamery_forms_entry_label_rel',
			'label_id',
			'entry_id'
		);
	}
}
