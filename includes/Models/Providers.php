<?php

/**
 * Class Providers
 *
 * Represents the Providers model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class Providers
 *
 * Represents the Providers model for Streamery Forms.
 *
 * @package StreameryForms\Models
 */
class Providers extends Model
{

	/**
	 * The table associated with the model.
	 *
	 * @var string
	 */
	protected $table = 'streamery_forms_providers';

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
		'provider_type',
		'form_identifier',
		'settings',
		'is_active',
		'date_created',
	);

	/**
	 * The attributes that should be cast.
	 *
	 * @var array
	 */
	protected $casts = array(
		'settings'    => 'array',
		'is_active'   => 'boolean',
		'date_created' => 'datetime',
	);
}
