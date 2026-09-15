<?php

/**
 * Database migration for email logs table.
 *
 * @package StreameryForms
 * @subpackage Database\Migrations
 * @since 1.0.0
 */

namespace StreameryForms\Database\Migrations;

use StreameryForms\Interfaces\Migration;
use Prappo\WpEloquent\Database\Capsule\Manager as Capsule;
use Prappo\WpEloquent\Database\Schema\Blueprint;

defined('ABSPATH') || exit;

/**
 * Class EmailLogs
 *
 * Represents the migration for creating the 'wp_streamery_forms_email_logs' table.
 *
 * @package StreameryForms\Database\Migrations
 */
class EmailLogs implements Migration
{

    /**
     * Table name for the migration.
     *
     * @var string
     */
    public static $table = 'streamery_forms_email_logs';

    /**
     * Run the migrations.
     *
     * @return void
     */
    public static function up()
    {
        // Capsule adds the WordPress table prefix automatically; pass name without prefix.
        if (Capsule::schema()->hasTable(self::$table)) {
            return;
        }

        Capsule::schema()->create(self::$table, function (Blueprint $table) {
            $table->id();
            $table->string('to_email', 255);
            $table->string('subject', 500)->nullable();
            $table->longText('message')->nullable();
            $table->text('headers')->nullable();
            $table->text('attachments')->nullable();
            $table->string('from_email', 255)->nullable();
            $table->string('from_name', 255)->nullable();
            $table->string('status', 50)->default('sent');
            $table->text('error_message')->nullable();
            $table->dateTime('date_sent');
            $table->dateTime('date_created');
            $table->index('to_email');
            $table->index('status');
            $table->index('date_sent');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public static function down()
    {
        Capsule::schema()->dropIfExists(self::$table);
    }
}
