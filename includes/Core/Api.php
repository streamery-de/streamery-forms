<?php

namespace StreameryForms\Core;

use StreameryForms\Traits\Base;
use StreameryForms\Libs\API\Config;

defined('ABSPATH') || exit;

/**
 * Class API
 *
 * Initializes and configures the API for the Streamery Forms.
 *
 * @package StreameryForms\Core
 */
class API {

	use Base;

	/**
	 * Initializes the API for the Streamery Forms.
	 *
	 * @return void
	 */
	public function init() {
		Config::set_route_file( STREAMERY_FORMS_DIR . '/includes/Routes/Api.php' )
			->set_namespace( 'StreameryForms\Api' )
			->init();
	}
}
