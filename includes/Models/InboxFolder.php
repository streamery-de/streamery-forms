<?php

/**
 * Class InboxFolder
 *
 * Represents the InboxFolder model for Streamery Forms.
 *
 * @package StreameryForms\Models
 * @since 1.0.0
 */

namespace StreameryForms\Models;

use Prappo\WpEloquent\Database\Eloquent\Model;

defined('ABSPATH') || exit;

/**
 * Class InboxFolder
 *
 * Represents user-defined inbox folders (one tree per mailbox).
 *
 * @package StreameryForms\Models
 */
class InboxFolder extends Model
{

	/**
	 * The table associated with the model.
	 *
	 * @var string
	 */
	protected $table = 'streamery_forms_inbox_folders';

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
		'mailbox_id',
		'parent_id',
		'name',
		'sort_order',
		'date_created',
	);

	/**
	 * The storage format of the model's date fields.
	 *
	 * @var string
	 */
	protected $dateFormat = 'Y-m-d H:i:s';

	/**
	 * Get the mailbox that owns the folder.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function mailbox()
	{
		return $this->belongsTo(Mailboxes::class, 'mailbox_id');
	}

	/**
	 * Get the parent folder.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function parent()
	{
		return $this->belongsTo(InboxFolder::class, 'parent_id');
	}

	/**
	 * Get the child folders.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function children()
	{
		return $this->hasMany(InboxFolder::class, 'parent_id')->orderBy('sort_order');
	}

	/**
	 * Get the entries in this folder.
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function entries()
	{
		return $this->hasMany(Entries::class, 'folder_id');
	}
}
