<?php

/**
 * Conditional Evaluator
 *
 * Evaluates provider conditional_show rules against submission data.
 * Mirrors the frontend logic in view.ts (evaluateSingleCondition / evaluateConditionConfig).
 *
 * @package StreameryForms\Controllers\Submissions
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Submissions;

defined('ABSPATH') || exit;

/**
 * ConditionalEvaluator Class
 */
class ConditionalEvaluator {

	/**
	 * Evaluates a single condition against submission data.
	 *
	 * @param array  $condition     Condition with keys: sourceFieldName, operator, value (optional).
	 * @param array  $submission_data Submission data (field name => value).
	 * @return bool True if condition is satisfied.
	 */
	public static function evaluate_single_condition(array $condition, array $submission_data): bool {
		$source_field = isset($condition['sourceFieldName']) ? $condition['sourceFieldName'] : '';
		if (empty($source_field)) {
			return true;
		}

		$raw = isset($submission_data[ $source_field ]) ? $submission_data[ $source_field ] : '';
		if (is_array($raw)) {
			$raw = implode(', ', $raw);
		}
		$raw = trim((string) $raw);

		$compare = isset($condition['value']) ? trim((string) $condition['value']) : '';
		$operator = isset($condition['operator']) ? $condition['operator'] : 'equals';

		switch ($operator) {
			case 'equals':
				return $raw === $compare;
			case 'notEquals':
				return $raw !== $compare;
			case 'isEmpty':
				return $raw === '';
			case 'isNotEmpty':
				return $raw !== '';
			case 'contains':
				return $compare !== '' && strpos($raw, $compare) !== false;
			default:
				return true;
		}
	}

	/**
	 * Evaluates a full conditional_show config (single rule or group with logic + conditions).
	 *
	 * @param array|null $config          Conditional config: either { sourceFieldName, operator, value? } or { logic, conditions: [] }.
	 * @param array      $submission_data Submission data.
	 * @return bool True if config is empty/null or all conditions pass.
	 */
	public static function evaluate_config($config, array $submission_data): bool {
		if ($config === null || ! is_array($config)) {
			return true;
		}

		// Group: { logic: 'and'|'or', conditions: [ ... ] }
		if (isset($config['conditions']) && is_array($config['conditions'])) {
			$results = array();
			foreach ($config['conditions'] as $c) {
				if (is_array($c) && ! empty($c['sourceFieldName'])) {
					$results[] = self::evaluate_single_condition($c, $submission_data);
				}
			}
			if (empty($results)) {
				return true;
			}
			$logic = isset($config['logic']) && $config['logic'] === 'or' ? 'or' : 'and';
			if ($logic === 'and') {
				return ! in_array(false, $results, true);
			}
			return in_array(true, $results, true);
		}

		// Single rule
		if (isset($config['sourceFieldName']) && $config['sourceFieldName'] !== '') {
			return self::evaluate_single_condition($config, $submission_data);
		}

		return true;
	}
}
