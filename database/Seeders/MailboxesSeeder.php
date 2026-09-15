<?php

/**
 * Database seeder for mailboxes.
 *
 * @package StreameryForms
 * @subpackage Database\Seeders
 * @since 1.0.0
 */

namespace StreameryForms\Database\Seeders;

use StreameryForms\Models\Mailboxes;

defined('ABSPATH') || exit;

/**
 * Class MailboxesSeeder
 *
 * Represents the seeder for the 'streamery_forms_mailboxes' table.
 *
 * @package StreameryForms\Database\Seeders
 * @since 1.0.0
 */
class MailboxesSeeder
{

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public static function run()
    {
        $current_date = gmdate('Y-m-d H:i:s');

        // Check if default mailbox already exists.
        $default_mailbox = Mailboxes::where('is_default', true)->first();

        if (! $default_mailbox) {
            // Create default mailbox.
            Mailboxes::create(
                array(
                    'title'       => __('Default Mailbox', 'streamery-forms'),
                    'is_default'  => true,
                    'date_created' => $current_date,
                    'user_id'     => null, // Default mailbox is not user-specific.
                )
            );
        }
    }
}
