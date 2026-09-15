<?php

/**
 * Database Provider
 *
 * Stores form submissions in the database using the Entries model.
 *
 * @package StreameryForms\Providers
 * @since 1.0.0
 */

namespace StreameryForms\Providers;

use StreameryForms\Models\Entries;
use StreameryForms\Models\Mailboxes;
use StreameryForms\Core\Debug;

defined('ABSPATH') || exit;

/**
 * Database Provider Class
 *
 * Handles database storage for form submissions.
 */
class Database extends AbstractProvider
{

    /**
     * Returns the unique slug of the provider.
     *
     * @return string
     */
    public function get_slug(): string
    {
        return 'database';
    }

    /**
     * Returns the display name of the provider.
     *
     * @return string
     */
    public function get_title(): string
    {
        return __('Database Storage', 'streamery-forms');
    }

    /**
     * The database feed is mandatory: every submission is stored before any
     * optional provider (mail, webhook, ...) runs, so a failing integration
     * can never cost a lead.
     *
     * @return bool
     */
    public function is_required(): bool
    {
        return true;
    }

    /**
     * Processes a form submission.
     *
     * @param array  $submission_data The form data
     * @param array  $provider_settings The individual settings for this provider
     * @param string $form_identifier The form identifier
     * @return bool Success of processing
     */
    public function process_submission(
        array $submission_data,
        array $provider_settings,
        string $form_identifier
    ): bool {
        try {
            // Replace placeholders in subject and from_email
            $subject = $this->replace_placeholders(
                $provider_settings['subject'] ?? __('New Form Submission: {form_title}', 'streamery-forms'),
                $submission_data,
                $form_identifier
            );
            $from_email = sanitize_email(
                $this->replace_placeholders(
                    $provider_settings['from_email'] ?? get_option('admin_email'),
                    $submission_data,
                    $form_identifier
                )
            );

            $mailbox_id = absint($provider_settings['mailbox_id'] ?? 1);

            Debug::log(sprintf(
                    'Streamery Forms Database Provider: Saving entry to mailbox_id: %d for form "%s"',
                    $mailbox_id,
                    $form_identifier
                ));

            // GDPR: a form can opt out of storing the submitter's IP entirely.
            $form_settings = is_array($provider_settings['_form_settings'] ?? null) ? $provider_settings['_form_settings'] : array();
            $store_ip      = ! isset($form_settings['privacy']['store_ip']) || (bool) $form_settings['privacy']['store_ip'];

            $entry = new Entries();
            $entry->mailbox_id      = $mailbox_id;
            $entry->form_identifier = $form_identifier;
            $entry->wp_post_id      = isset($provider_settings['wp_post_id']) ? absint($provider_settings['wp_post_id']) : null;
            $entry->data            = $submission_data;
            $entry->ip_address      = $store_ip ? $this->get_client_ip() : null;
            $entry->is_read         = false;
            $entry->subject         = sanitize_text_field($subject);
            $entry->from_mail       = $from_email;
            $entry->date_created    = current_time('mysql');

            $result = $entry->save();

            if ($result) {
                    Debug::log(sprintf(
                        'Streamery Forms Database Provider: Entry saved successfully (ID: %d, Mailbox ID: %d) for form "%s"',
                        $entry->id,
                        $entry->mailbox_id,
                        $form_identifier
                    ));
                } else {
                    Debug::log('Streamery Forms Database Provider Error: Failed to save entry');
                }

            return $result;
        } catch (\Exception $e) {
            Debug::log('Streamery Forms Database Provider Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Returns the field definitions for the settings.
     *
     * @return array Array of field definitions
     */
    public function get_settings_fields(): array
    {
        // Get all mailboxes for select options
        $mailboxes = Mailboxes::orderBy('title', 'ASC')->get();
        $mailbox_options = array();
        
        foreach ($mailboxes as $mailbox) {
            $mailbox_options[] = array(
                'value' => (string) $mailbox->id,
                'label' => $mailbox->title . ($mailbox->is_default ? ' (' . __('Default', 'streamery-forms') . ')' : ''),
            );
        }
        
        // If no mailboxes exist, add default option
        if (empty($mailbox_options)) {
            $mailbox_options[] = array(
                'value' => '1',
                'label' => __('Default Mailbox', 'streamery-forms'),
            );
        }

        return array(
            array(
                'name'                => 'mailbox_id',
                'label'               => __('Mailbox', 'streamery-forms'),
                'type'                => 'select',
                'required'            => true,
                'default'             => $this->get_default_mailbox_id(),
                'description'         => __('Select the mailbox where the entry will be stored.', 'streamery-forms'),
                'options'             => $mailbox_options,
                // Each form may route its own entries to a different mailbox.
                'allow_form_override' => true,
            ),
            array(
                'name'                => 'subject',
                'label'               => __('Subject', 'streamery-forms'),
                'type'                => 'text',
                'required'            => false,
                'default'             => __('New Form Submission: {form_title}', 'streamery-forms'),
                'description'         => __('Subject for the entry. Placeholders like {form_title} will be replaced.', 'streamery-forms'),
                'allow_form_override' => true,
            ),
            array(
                'name'        => 'from_email',
                'label'       => __('From Email', 'streamery-forms'),
                'type'        => 'text',
                'required'    => false,
                'default'     => get_option('admin_email'),
                'description' => __('Email address of the sender that will be stored in the entry. Placeholders like {field_email} can be used.', 'streamery-forms'),
            ),
        );
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
