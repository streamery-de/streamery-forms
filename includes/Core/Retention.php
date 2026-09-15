<?php

/**
 * Retention
 *
 * Deletes stored entries once they pass the retention period configured for
 * their form. Entries used to be kept forever with no way to change that,
 * which is a problem for anyone with a GDPR deletion policy.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Models\Entries;
use StreameryForms\Models\Forms;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Retention
 */
class Retention
{
	use Base;

	/**
	 * Cron hook name.
	 */
	public const CRON_HOOK = 'streamery_forms_purge_expired_entries';

	/**
	 * Registers the cron schedule and handler.
	 *
	 * @return void
	 */
	public function init()
	{
		add_action(self::CRON_HOOK, array($this, 'purge_expired_entries'));

		if (! wp_next_scheduled(self::CRON_HOOK)) {
			wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK);
		}
	}

	/**
	 * Clears the schedule (called on deactivation).
	 *
	 * @return void
	 */
	public static function unschedule(): void
	{
		$timestamp = wp_next_scheduled(self::CRON_HOOK);
		if ($timestamp) {
			wp_unschedule_event($timestamp, self::CRON_HOOK);
		}
	}

	/**
	 * Deletes entries older than their form's retention period.
	 *
	 * Forms with no retention configured (0 days) are skipped -- keeping
	 * entries forever stays the default, deletion is always opt-in.
	 *
	 * @return int Number of deleted entries.
	 */
	public function purge_expired_entries(): int
	{
		$deleted = 0;

		try {
			$forms = Forms::all();
		} catch (\Exception $e) {
			$this->log('Could not read the form index: ' . $e->getMessage());
			return 0;
		}

		foreach ($forms as $form) {
			$config = is_array($form->config) ? $form->config : array();
			$days   = absint($config['settings']['privacy']['retention_days'] ?? 0);

			if ($days <= 0) {
				continue;
			}

			$cutoff = gmdate('Y-m-d H:i:s', time() - ($days * DAY_IN_SECONDS));

			try {
				$deleted += (int) Entries::where('form_identifier', $form->form_identifier)
					->where('date_created', '<', $cutoff)
					->delete();
			} catch (\Exception $e) {
				$this->log('Failed to purge entries for "' . $form->form_identifier . '": ' . $e->getMessage());
			}
		}

		if ($deleted > 0) {
			$this->log(sprintf('Purged %d expired entries.', $deleted));
		}

		return $deleted;
	}

	/**
	 * @param string $message Message.
	 * @return void
	 */
	private function log(string $message): void
	{
		Debug::log('Streamery Forms Retention: ' . $message);
	}
}
