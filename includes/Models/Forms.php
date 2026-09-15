<?php

/**
 * Class Forms
 *
 * Represents the server-side form index for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class Forms
 *
 * @package StreameryForms\Models
 */
class Forms extends Model
{

	/**
	 * The table associated with the model.
	 *
	 * @var string
	 */
	protected $table = 'streamery_forms_forms';

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
		'form_identifier',
		'post_id',
		'config',
		'fields',
		'updated_at',
	);

	/**
	 * The attributes that should be cast.
	 *
	 * @var array
	 */
	protected $casts = array(
		'config'     => 'array',
		'fields'     => 'array',
		'updated_at' => 'datetime',
	);
}
