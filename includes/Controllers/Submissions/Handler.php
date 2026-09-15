<?php

/**
 * Submission Handler
 *
 * Orchestrates form submission processing through multiple providers.
 *
 * @package StreameryForms\Controllers\Submissions
 * @since 1.0.0
 */

namespace StreameryForms\Controllers\Submissions;

use StreameryForms\Core\Debug;
use StreameryForms\Core\FormRegistry;
use StreameryForms\Models\Mailboxes;
use StreameryForms\Models\Providers;
use StreameryForms\Providers\Registry;

defined('ABSPATH') || exit;

/**
 * Submission Handler Class
 *
 * Runs a submission through the provider feeds the *server* has resolved for
 * that form (see Core\FormRegistry). Required feeds -- currently the database
 * provider -- always run first, so an optional integration failing later can
 * never lose the submission.
 */
class Handler
{
    /**
     * Processes a form submission.
     *
     * @param array  $submission_data The form data.
     * @param string $form_identifier The form identifier.
     * @param array  $form_config     Server-resolved form config from FormRegistry.
     * @return array Result with success, errors, results.
     */
    public function process(array $submission_data, string $form_identifier, array $form_config = array()): array
    {
        $errors  = array();
        $results = array();

        $registry      = Registry::get_instance();
        $form_registry = FormRegistry::get_instance();

        $config    = $form_config['config'] ?? array();
        $post_id   = isset($form_config['post_id']) ? (int) $form_config['post_id'] : 0;
        $overrides = isset($config['provider_overrides']) && is_array($config['provider_overrides'])
            ? $config['provider_overrides']
            : array();

        // Required feeds first, then the form's own feeds. Both come from the
        // server-side index, never from the request.
        $feed_ids = $form_registry->resolve_provider_feed_ids($config);

        if (empty($feed_ids)) {
            $errors[] = __('No provider is configured for this form.', 'streamery-forms');
            return $this->compile($submission_data, $form_identifier, $results, $errors, false);
        }

        $feeds = $this->load_feeds($feed_ids);

        // A required provider that has no active feed at all is a
        // misconfiguration we must not silently swallow.
        $required_slugs = $registry->get_required_provider_slugs();
        $present_slugs  = array();
        foreach ($feeds as $feed) {
            $present_slugs[] = (string) ($feed->provider_type ?? '');
        }
        foreach ($required_slugs as $slug) {
            if (! in_array($slug, $present_slugs, true)) {
                $errors[] = sprintf(
                    /* translators: %s: provider slug. */
                    __('Required provider "%s" has no active feed.', 'streamery-forms'),
                    $slug
                );
            }
        }

        $required_failed = ! empty($errors);

        foreach ($feeds as $feed) {
            $feed_id       = (int) $feed->id;
            $provider_slug = (string) ($feed->provider_type ?? '');
            $provider      = $registry->get_provider($provider_slug);
            $result_key    = $provider_slug . '_' . $feed_id;

            if (! $provider) {
                $errors[] = sprintf(
                    /* translators: %s: provider slug. */
                    __('Provider "%s" not found.', 'streamery-forms'),
                    $provider_slug
                );
                continue;
            }

            $is_required = $provider->is_required();
            $override    = isset($overrides[$feed_id]) && is_array($overrides[$feed_id]) ? $overrides[$feed_id] : array();

            // Conditional logic can skip an optional feed, but never a required one.
            if (! $is_required && ! empty($override['conditional_show'])) {
                if (! ConditionalEvaluator::evaluate_config($override['conditional_show'], $submission_data)) {
                    $results[$result_key] = array(
                        'success'  => true,
                        'provider' => $provider->get_title(),
                        'skipped'  => true,
                        'reason'   => 'conditional_not_met',
                    );
                    continue;
                }
            }

            $settings = $this->build_settings($provider, $feed, $override, $config, $post_id, $feed_id, $form_identifier);

            try {
                $success = $provider->process_submission($submission_data, $settings, $form_identifier);

                $results[$result_key] = array(
                    'success'  => $success,
                    'provider' => $provider->get_title(),
                    'required' => $is_required,
                );

                if (! $success) {
                    $message = sprintf(
                        /* translators: %s: provider title. */
                        __('Provider "%s" could not process the submission.', 'streamery-forms'),
                        $provider->get_title()
                    );
                    $errors[] = $message;

                    if ($is_required) {
                        $required_failed = true;
                    }
                }
            } catch (\Exception $e) {
                $errors[] = sprintf(
                    /* translators: 1: provider title, 2: error message. */
                    __('Error in Provider "%1$s": %2$s', 'streamery-forms'),
                    $provider->get_title(),
                    $e->getMessage()
                );
                $results[$result_key] = array(
                    'success'  => false,
                    'error'    => $e->getMessage(),
                    'required' => $is_required,
                );

                if ($is_required) {
                    $required_failed = true;
                }
            }
        }

        // Success means every *required* provider succeeded. An optional feed
        // (mail, webhook) failing is logged and surfaced in the admin, but the
        // visitor still gets a success response -- their submission is stored.
        return $this->compile($submission_data, $form_identifier, $results, $errors, ! $required_failed);
    }

    /**
     * Loads the feed rows for a set of IDs, preserving the resolved order.
     *
     * @param array<int> $feed_ids Ordered feed IDs.
     * @return array
     */
    private function load_feeds(array $feed_ids): array
    {
        try {
            $rows = Providers::whereIn('id', $feed_ids)
                ->where('is_active', true)
                ->get();
        } catch (\Exception $e) {
            Debug::log('Streamery Forms Handler: failed to load provider feeds: ' . $e->getMessage());
            return array();
        }

        $by_id = array();
        foreach ($rows as $row) {
            $by_id[(int) $row->id] = $row;
        }

        $ordered = array();
        foreach ($feed_ids as $id) {
            if (isset($by_id[(int) $id])) {
                $ordered[] = $by_id[(int) $id];
            }
        }

        return $ordered;
    }

    /**
     * Merges a feed's stored settings with the form-level overrides the
     * provider actually permits, plus the internal context keys providers
     * need (feed id for delivery logging, post id and title for payloads).
     *
     * @param \StreameryForms\Providers\AbstractProvider $provider        Provider instance.
     * @param object                                $feed            Feed row.
     * @param array                                 $override        Form-level override for this feed.
     * @param array                                 $config          Form config.
     * @param int                                   $post_id         Post the form lives on.
     * @param int                                   $feed_id         Feed ID.
     * @param string                                $form_identifier Form identifier.
     * @return array
     */
    private function build_settings($provider, $feed, array $override, array $config, int $post_id, int $feed_id, string $form_identifier): array
    {
        $settings = is_array($feed->settings) ? $feed->settings : array();

        // Only settings the provider marked allow_form_override can be changed
        // per form, and each is sanitized against its declared type.
        if (! empty($override['settings']) && is_array($override['settings'])) {
            $allowed = $provider->filter_form_settings_overrides($override['settings']);
            $settings = array_merge($settings, $allowed);
        }

        // The form block's own mailboxId maps onto the database provider's
        // mailbox_id setting, which is how existing forms keep working.
        if ($provider->get_slug() === 'database' && ! empty($config['mailbox_id'])) {
            $settings['mailbox_id'] = absint($config['mailbox_id']);
        }

        if (empty($settings['mailbox_id']) && $provider->get_slug() === 'database') {
            $settings['mailbox_id'] = $this->get_default_mailbox_id();
        }

        $settings['_form_use_provider_layout'] = isset($override['use_provider_layout'])
            ? (bool) $override['use_provider_layout']
            : true;
        $settings['_form_content'] = isset($override['content']) ? (string) $override['content'] : '';

        $settings['_feed_id']       = $feed_id;
        $settings['_form_title']    = (string) ($config['form_title'] ?? $form_identifier);
        $settings['wp_post_id']     = $post_id;
        $settings['_form_settings'] = is_array($config['settings'] ?? null) ? $config['settings'] : array();

        return $settings;
    }

    /**
     * Builds the response array, attaching debug data when enabled.
     *
     * @param array  $submission_data Form data.
     * @param string $form_identifier Form identifier.
     * @param array  $results         Per-provider results.
     * @param array  $errors          Collected errors.
     * @param bool   $success         Overall success.
     * @return array
     */
    private function compile(array $submission_data, string $form_identifier, array $results, array $errors, bool $success): array
    {
        $response = array(
            'success' => $success,
            'errors'  => $errors,
            'results' => $results,
        );

        if (Debug::is_enabled()) {
            $response['debug'] = Debug::collect_debug_data(
                $submission_data,
                $form_identifier,
                $results,
                $errors
            );
        }

        return $response;
    }

    /**
     * Gets the default mailbox ID.
     *
     * @return int The mailbox ID (default: 1)
     */
    private function get_default_mailbox_id(): int
    {
        $default_mailbox = Mailboxes::where('is_default', true)->first();

        if ($default_mailbox) {
            return (int) $default_mailbox->id;
        }

        // Fallback: First mailbox or ID 1
        $first_mailbox = Mailboxes::orderBy('id', 'ASC')->first();
        return $first_mailbox ? (int) $first_mailbox->id : 1;
    }
}
