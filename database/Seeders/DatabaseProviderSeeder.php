<?php

/**
 * Database seeder for default Database Provider.
 *
 * @package StreameryForms
 * @subpackage Database\Seeders
 * @since 1.0.0
 */

namespace StreameryForms\Database\Seeders;

use StreameryForms\Models\Providers;
use StreameryForms\Models\Mailboxes;

defined('ABSPATH') || exit;

/**
 * Class DatabaseProviderSeeder
 *
 * Creates the default Database Provider entry in the database.
 *
 * @package StreameryForms\Database\Seeders
 * @since 1.0.0
 */
class DatabaseProviderSeeder
{

    /**
     * Run the database seeds.
     *
     * @return void
     */
    public static function run()
    {
        // Check if Database Provider already exists.
        $database_provider = Providers::where('provider_type', 'database')
            ->whereNull('form_identifier') // Global provider
            ->first();

        if (! $database_provider) {
            // Get default mailbox ID
            $default_mailbox = Mailboxes::where('is_default', true)->first();
            $mailbox_id = $default_mailbox ? (int) $default_mailbox->id : 1;

            // Create default Database Provider.
            Providers::create(
                array(
                    'name'            => __('Database Provider (Default)', 'streamery-forms'),
                    'provider_type'   => 'database',
                    'form_identifier' => null, // Global provider
                    'settings'        => array(
                        'mailbox_id'  => $mailbox_id,
                        'subject'     => __('New Form Submission: {form_title}', 'streamery-forms'),
                        'from_email'  => get_option('admin_email'),
                    ),
                    'is_active'      => true,
                    'date_created'   => current_time('mysql'),
                )
            );
        }
    }
}
