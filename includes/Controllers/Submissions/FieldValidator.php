<?php

/**
 * Field Validator
 *
 * Validates a submission against the server-side field schema that
 * Core\FormRegistry extracted from the form's blocks. Before this existed,
 * submission_data was taken at face value: unknown fields were stored,
 * required fields were only enforced by the browser, and a select could be
 * posted with any value at all.
 *
 * @package StreameryForms\Controllers\Submissions
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Submissions;

defined('ABSPATH') || exit;

/**
 * Class FieldValidator
 */
class FieldValidator
{
    /**
     * Field keys that are plugin metadata rather than form fields, and are
     * therefore allowed through even though they're not in the schema.
     *
     * @var array<string>
     */
    private const ALLOWED_META_KEYS = array(
        '_primary_mail_field',
    );

    /**
     * Longest free-text value a checkbox/radio "custom option" may carry.
     * Matches the maxlength of the frontend text field.
     */
    private const CUSTOM_OPTION_MAX_LENGTH = 200;

    /**
     * Validates and filters submission data against a form's field schema.
     *
     * @param array $submission_data Sanitized submission data.
     * @param array $schema          Field schema from FormRegistry.
     * @return array{data: array, errors: array<string, string>}
     */
    public function validate(array $submission_data, array $schema): array
    {
        // Without a schema (e.g. a form whose post could not be re-indexed) we
        // can't tell valid fields from junk, so pass the data through as-is
        // rather than rejecting a legitimate submission.
        if (empty($schema)) {
            return array('data' => $submission_data, 'errors' => array());
        }

        $clean  = array();
        $errors = array();

        // Keep the metadata keys the pipeline itself relies on.
        foreach (self::ALLOWED_META_KEYS as $meta_key) {
            if (isset($submission_data[$meta_key])) {
                $clean[$meta_key] = $submission_data[$meta_key];
            }
        }

        foreach ($schema as $key => $field) {
            $present = array_key_exists($key, $submission_data);
            $value   = $present ? $submission_data[$key] : null;

            if (! $present || $this->is_empty($value)) {
                // A field hidden by unmet conditional logic legitimately submits
                // nothing, so it can't be treated as a missing required value.
                if (! empty($field['required']) && empty($field['conditional'])) {
                    $errors[$field['name']] = sprintf(
                        /* translators: %s: form field name. */
                        __('The field "%s" is required.', 'streamery-forms'),
                        $field['name']
                    );
                }
                continue;
            }

            $value = $this->normalize_multi_value($field, $value);

            $error = $this->validate_value($field, $value);
            if (null !== $error) {
                $errors[$field['name']] = $error;
                continue;
            }

            $clean[$key] = $value;
        }

        return array('data' => $clean, 'errors' => $errors);
    }

    /**
     * @param mixed $value Value.
     * @return bool
     */
    private function is_empty($value): bool
    {
        if (is_array($value)) {
            return empty($value);
        }

        return '' === trim((string) $value);
    }

    /**
     * Turns a comma-joined checkbox group value into an array.
     *
     * Older versions of the frontend script sent a checkbox group as one
     * string ("a, b"), and cached pages may still ship that script. A string
     * that is itself one of the options is left alone, so an option value
     * containing ", " still validates.
     *
     * @param array $field Field definition.
     * @param mixed $value Submitted value.
     * @return mixed
     */
    private function normalize_multi_value(array $field, $value)
    {
        if (empty($field['multi']) || ! is_string($value)) {
            return $value;
        }

        $options = $field['options'] ?? array();
        if (in_array($value, $options, true)) {
            return array($value);
        }

        return array_map('trim', explode(', ', $value));
    }

    /**
     * Validates a single value against its field definition.
     *
     * @param array $field Field definition.
     * @param mixed $value Submitted value.
     * @return string|null Error message, or null when valid.
     */
    private function validate_value(array $field, $value): ?string
    {
        $type = $field['type'] ?? 'input';

        switch ($type) {
            case 'select':
            case 'radio':
            case 'checkbox':
                return $this->validate_choice($field, $value);

            case 'file':
                return $this->validate_file($field, $value);

            case 'input':
                return $this->validate_input($field, $value);
        }

        return null;
    }

    /**
     * Ensures every submitted value is one the form actually offered.
     *
     * @param array $field Field definition.
     * @param mixed $value Submitted value.
     * @return string|null
     */
    private function validate_choice(array $field, $value): ?string
    {
        $options = $field['options'] ?? array();

        // No fixed option list (e.g. a select populated at render time) --
        // optionally validate via filter, otherwise accept any scalar value.
        if (empty($options)) {
            if (! empty($field['options_populated'])) {
                /**
                 * Validate a submitted value for a populated select field.
                 *
                 * @param string|null $error  Error message, or null when valid.
                 * @param mixed       $value  Submitted value.
                 * @param array       $field  Field schema entry.
                 */
                $error = apply_filters('streamery-forms/select/validate_populated_value', null, $value, $field);

                return is_string($error) && '' !== $error ? $error : null;
            }

            return null;
        }

        $submitted = is_array($value) ? $value : array($value);

        // A group with a custom option accepts exactly one free-text value
        // on top of the fixed options.
        $custom_left = ! empty($field['allow_custom']) ? 1 : 0;

        foreach ($submitted as $item) {
            if (is_array($item)) {
                return $this->invalid_value_error($field);
            }

            if (in_array((string) $item, $options, true)) {
                continue;
            }

            $item = trim((string) $item);
            if ($custom_left > 0 && '' !== $item && mb_strlen($item) <= self::CUSTOM_OPTION_MAX_LENGTH) {
                $custom_left--;
                continue;
            }

            return $this->invalid_value_error($field);
        }

        return null;
    }

    /**
     * @param array $field Field definition.
     * @param mixed $value Submitted value.
     * @return string|null
     */
    private function validate_file(array $field, $value): ?string
    {
        if (! is_array($value)) {
            return $this->invalid_value_error($field);
        }

        $max_files = ! empty($field['multiple']) ? max(1, (int) ($field['max_files'] ?? 1)) : 1;

        if (count($value) > $max_files) {
            return sprintf(
                /* translators: 1: form field name, 2: maximum number of files. */
                __('The field "%1$s" accepts at most %2$d file(s).', 'streamery-forms'),
                $field['name'],
                $max_files
            );
        }

        return null;
    }

    /**
     * @param array $field Field definition.
     * @param mixed $value Submitted value.
     * @return string|null
     */
    private function validate_input(array $field, $value): ?string
    {
        if (is_array($value)) {
            return $this->invalid_value_error($field);
        }

        $value = (string) $value;

        switch ($field['input_type'] ?? 'text') {
            case 'email':
                if (! is_email($value)) {
                    return sprintf(
                        /* translators: %s: form field name. */
                        __('The field "%s" must be a valid email address.', 'streamery-forms'),
                        $field['name']
                    );
                }
                break;

            case 'number':
                if (! is_numeric($value)) {
                    return sprintf(
                        /* translators: %s: form field name. */
                        __('The field "%s" must be a number.', 'streamery-forms'),
                        $field['name']
                    );
                }
                break;

            case 'url':
                if (! filter_var($value, FILTER_VALIDATE_URL)) {
                    return sprintf(
                        /* translators: %s: form field name. */
                        __('The field "%s" must be a valid URL.', 'streamery-forms'),
                        $field['name']
                    );
                }
                break;
        }

        return null;
    }

    /**
     * @param array $field Field definition.
     * @return string
     */
    private function invalid_value_error(array $field): string
    {
        return sprintf(
            /* translators: %s: form field name. */
            __('The field "%s" has an invalid value.', 'streamery-forms'),
            $field['name']
        );
    }
}
