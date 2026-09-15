<?php

/**
 * Entry Export
 *
 * CSV export of inbox submissions -- expected of any form plugin, and
 * previously not possible at all.
 *
 * @package StreameryForms\Controllers\Entries
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Entries;

use StreameryForms\Models\Entries;

defined('ABSPATH') || exit;

/**
 * Class Export
 */
class Export
{
	/**
	 * Upper bound on a single export, so one request cannot try to build an
	 * unbounded string in memory.
	 */
	private const MAX_ROWS = 10000;

	/**
	 * Exports entries as CSV.
	 *
	 * Returns the CSV as a string in a JSON envelope rather than streaming a
	 * file download: the admin app talks to this over fetch() with a nonce, and
	 * a streamed download would need a separate, differently-authenticated
	 * request. The client turns it into a file.
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 * @return array|\WP_Error
	 */
	public function export(\WP_REST_Request $request)
	{
		try {
			$query = Entries::query();

			if ($request->get_param('mailbox_id')) {
				$mailbox_id = absint($request->get_param('mailbox_id'));
				if ($mailbox_id > 0) {
					$query->where('mailbox_id', $mailbox_id);
				}
			}

			if ($request->get_param('form_identifier')) {
				$query->where('form_identifier', sanitize_text_field($request->get_param('form_identifier')));
			}

			if ($request->get_param('status')) {
				$query->where('status', sanitize_text_field($request->get_param('status')));
			}

			if ($request->has_param('folder_id')) {
				$folder_id = absint($request->get_param('folder_id'));
				if ($folder_id > 0) {
					$query->where('folder_id', $folder_id);
				}
			}

			$entries = $query->orderBy('date_created', 'DESC')
				->limit(self::MAX_ROWS)
				->get();

			$rows = array();
			foreach ($entries as $entry) {
				$rows[] = $this->flatten($entry);
			}

			$columns = $this->collect_columns($rows);
			$csv     = $this->build_csv($columns, $rows);

			return array(
				'success'  => true,
				'filename' => $this->build_filename($request),
				'mime'     => 'text/csv',
				'rows'     => count($rows),
				'truncated' => count($rows) >= self::MAX_ROWS,
				'csv'      => $csv,
			);
		} catch (\Exception $e) {
			return new \WP_Error(
				'entry_export_failed',
				__('Failed to export entries: ', 'streamery-forms') . $e->getMessage(),
				array('status' => 500)
			);
		}
	}

	/**
	 * Turns one entry into a flat label => value map.
	 *
	 * @param object $entry Entry row.
	 * @return array<string, string>
	 */
	private function flatten($entry): array
	{
		$row = array(
			'id'              => (string) $entry->id,
			'date'            => (string) $entry->date_created,
			'form'            => (string) $entry->form_identifier,
			'subject'         => (string) $entry->subject,
			'from'            => (string) $entry->from_mail,
			'status'          => (string) $entry->status,
			'ip_address'      => (string) $entry->ip_address,
		);

		$data = is_array($entry->data) ? $entry->data : array();

		foreach ($data as $key => $value) {
			$key = (string) $key;

			// Skip internal metadata.
			if (0 === strpos($key, '_')) {
				continue;
			}

			// Never let a submitted field overwrite one of the fixed columns.
			$column = isset($row[$key]) ? 'field_' . $key : $key;

			if (is_array($value)) {
				if (! empty($value) && is_array($value[0] ?? null) && isset($value[0]['url'])) {
					$urls = array();
					foreach ($value as $file) {
						$urls[] = (string) ($file['url'] ?? '');
					}
					$row[$column] = implode(' ', array_filter($urls));
					continue;
				}

				$row[$column] = implode(', ', array_map(function ($item) {
					return is_scalar($item) ? (string) $item : '';
				}, $value));
				continue;
			}

			$row[$column] = is_bool($value) ? ($value ? '1' : '0') : (string) $value;
		}

		return $row;
	}

	/**
	 * Union of all columns across rows, so forms whose fields changed over time
	 * still export completely.
	 *
	 * @param array $rows Flattened rows.
	 * @return array<string>
	 */
	private function collect_columns(array $rows): array
	{
		$columns = array();

		foreach ($rows as $row) {
			foreach (array_keys($row) as $column) {
				$columns[$column] = true;
			}
		}

		return array_keys($columns);
	}

	/**
	 * @param array $columns Column names.
	 * @param array $rows    Flattened rows.
	 * @return string
	 */
	private function build_csv(array $columns, array $rows): string
	{
		$lines = array($this->csv_line($columns));

		foreach ($rows as $row) {
			$line = array();
			foreach ($columns as $column) {
				$line[] = $this->neutralize_formula(isset($row[$column]) ? (string) $row[$column] : '');
			}
			$lines[] = $this->csv_line($line);
		}

		// UTF-8 BOM so Excel opens umlauts correctly instead of mojibake.
		return "\xEF\xBB\xBF" . implode("\n", $lines);
	}

	/**
	 * @param array<int, string> $fields Field values.
	 * @return string
	 */
	private function csv_line(array $fields): string
	{
		$escaped = array();
		foreach ($fields as $field) {
			$field = (string) $field;
			if (strpbrk($field, ",\"\n\r") !== false) {
				$escaped[] = '"' . str_replace('"', '""', $field) . '"';
			} else {
				$escaped[] = $field;
			}
		}

		return implode(',', $escaped);
	}

	/**
	 * Defuses CSV injection.
	 *
	 * Spreadsheet applications execute a cell starting with =, +, - or @ as a
	 * formula. Since these values come from anonymous form submissions, a
	 * submitter could otherwise plant a formula that runs when an administrator
	 * opens the export.
	 *
	 * @param string $value Cell value.
	 * @return string
	 */
	private function neutralize_formula(string $value): string
	{
		if ('' === $value) {
			return $value;
		}

		if (in_array($value[0], array('=', '+', '-', '@', "\t", "\r"), true)) {
			return "'" . $value;
		}

		return $value;
	}

	/**
	 * @param \WP_REST_Request $request Request.
	 * @return string
	 */
	private function build_filename(\WP_REST_Request $request): string
	{
		$parts = array('streamery-forms', 'entries');

		if ($request->get_param('form_identifier')) {
			$parts[] = sanitize_file_name((string) $request->get_param('form_identifier'));
		}

		$parts[] = gmdate('Y-m-d');

		return implode('-', $parts) . '.csv';
	}
}
