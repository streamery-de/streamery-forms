<?php

/**
 * Privacy
 *
 * Hooks Streamery Forms' stored submissions into WordPress' own personal data
 * exporter and eraser, so a site's existing GDPR export/erasure requests
 * (Tools -> Export/Erase Personal Data) also cover form entries. Without this,
 * a site owner answering a subject access request would silently miss
 * everything this plugin stored.
 *
 * @package StreameryForms\Core
 * @since 1.0.0
 */

namespace StreameryForms\Core;

use StreameryForms\Models\Entries;
use StreameryForms\Traits\Base;

defined('ABSPATH') || exit;

/**
 * Class Privacy
 */
class Privacy
{
	use Base;

	/**
	 * How many entries to process per exporter/eraser page.
	 */
	private const PER_PAGE = 50;

	/**
	 * Registers the exporter and eraser.
	 *
	 * @return void
	 */
	public function init()
	{
		add_filter('wp_privacy_personal_data_exporters', array($this, 'register_exporter'));
		add_filter('wp_privacy_personal_data_erasers', array($this, 'register_eraser'));
	}

	/**
	 * @param array $exporters Registered exporters.
	 * @return array
	 */
	public function register_exporter($exporters)
	{
		$exporters['streamery-forms'] = array(
			'exporter_friendly_name' => __('Streamery Forms form submissions', 'streamery-forms'),
			'callback'               => array($this, 'export_entries'),
		);

		return $exporters;
	}

	/**
	 * @param array $erasers Registered erasers.
	 * @return array
	 */
	public function register_eraser($erasers)
	{
		$erasers['streamery-forms'] = array(
			'eraser_friendly_name' => __('Streamery Forms form submissions', 'streamery-forms'),
			'callback'             => array($this, 'erase_entries'),
		);

		return $erasers;
	}

	/**
	 * Exports every submission whose data contains the requested email address.
	 *
	 * @param string $email_address Address being exported.
	 * @param int    $page          1-based page number.
	 * @return array
	 */
	public function export_entries($email_address, $page = 1)
	{
		$page    = max(1, (int) $page);
		$entries = $this->find_entries_for_email($email_address, $page);

		$export_items = array();

		foreach ($entries as $entry) {
			$data = array(
				array(
					'name'  => __('Form', 'streamery-forms'),
					'value' => (string) $entry->form_identifier,
				),
				array(
					'name'  => __('Submitted on', 'streamery-forms'),
					'value' => (string) $entry->date_created,
				),
			);

			if (! empty($entry->ip_address)) {
				$data[] = array(
					'name'  => __('IP address', 'streamery-forms'),
					'value' => (string) $entry->ip_address,
				);
			}

			foreach ($this->flatten_entry_data($entry) as $label => $value) {
				$data[] = array(
					'name'  => $label,
					'value' => $value,
				);
			}

			$export_items[] = array(
				'group_id'    => 'streamery-forms-entries',
				'group_label' => __('Form submissions', 'streamery-forms'),
				'item_id'     => 'streamery-forms-entry-' . (int) $entry->id,
				'data'        => $data,
			);
		}

		return array(
			'data' => $export_items,
			'done' => count($entries) < self::PER_PAGE,
		);
	}

	/**
	 * Deletes every submission whose data contains the requested email address.
	 *
	 * @param string $email_address Address being erased.
	 * @param int    $page          1-based page number.
	 * @return array
	 */
	public function erase_entries($email_address, $page = 1)
	{
		$page    = max(1, (int) $page);
		$entries = $this->find_entries_for_email($email_address, $page);

		$removed  = 0;
		$messages = array();

		foreach ($entries as $entry) {
			try {
				$entry->delete();
				++$removed;
			} catch (\Exception $e) {
				$messages[] = sprintf(
					/* translators: %d: submission ID that could not be deleted. */
					__('Could not delete form submission %d.', 'streamery-forms'),
					(int) $entry->id
				);
			}
		}

		return array(
			'items_removed'  => $removed,
			'items_retained' => count($entries) - $removed,
			'messages'       => $messages,
			// Deleting shifts later rows onto this page, so keep asking for
			// page 1 until a pass finds nothing left.
			'done'           => count($entries) === 0,
		);
	}

	/**
	 * Finds entries whose stored data mentions an email address.
	 *
	 * The submission payload is stored as JSON, so this matches on the raw
	 * column and then confirms per row -- a LIKE alone would also match an
	 * address that merely appears inside some longer string.
	 *
	 * @param string $email_address Address to look for.
	 * @param int    $page          1-based page number.
	 * @return array
	 */
	private function find_entries_for_email($email_address, $page): array
	{
		$email_address = sanitize_email($email_address);

		if ('' === $email_address || ! is_email($email_address)) {
			return array();
		}

		try {
			$rows = Entries::where('data', 'LIKE', '%' . $email_address . '%')
				->orderBy('id', 'ASC')
				->offset(($page - 1) * self::PER_PAGE)
				->limit(self::PER_PAGE)
				->get();
		} catch (\Exception $e) {
			return array();
		}

		$matches = array();
		foreach ($rows as $row) {
			if ($this->entry_mentions_email($row, $email_address)) {
				$matches[] = $row;
			}
		}

		return $matches;
	}

	/**
	 * @param object $entry         Entry row.
	 * @param string $email_address Address to confirm.
	 * @return bool
	 */
	private function entry_mentions_email($entry, string $email_address): bool
	{
		foreach ($this->flatten_entry_data($entry) as $value) {
			if (0 === strcasecmp(trim($value), $email_address)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Flattens an entry's stored submission data into label => printable value.
	 *
	 * @param object $entry Entry row.
	 * @return array<string, string>
	 */
	private function flatten_entry_data($entry): array
	{
		$data = is_array($entry->data) ? $entry->data : array();
		$flat = array();

		foreach ($data as $key => $value) {
			// Internal metadata, not something the visitor supplied.
			if (0 === strpos((string) $key, '_')) {
				continue;
			}

			if (is_array($value)) {
				// File field: list the file names rather than the raw structure.
				if (! empty($value) && is_array($value[0] ?? null) && isset($value[0]['url'])) {
					$names = array();
					foreach ($value as $file) {
						$names[] = (string) ($file['original_name'] ?? ($file['name'] ?? ''));
					}
					$flat[(string) $key] = implode(', ', array_filter($names));
					continue;
				}

				$flat[(string) $key] = implode(', ', array_map(function ($item) {
					return is_scalar($item) ? (string) $item : '';
				}, $value));
				continue;
			}

			$flat[(string) $key] = is_bool($value) ? ($value ? '1' : '0') : (string) $value;
		}

		return $flat;
	}
}
