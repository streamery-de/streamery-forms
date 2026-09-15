<?php

/**
 * API route exception.
 *
 * @package StreameryForms
 * @since 1.0.0
 */

namespace StreameryForms\Libs\API;

use Exception;

defined('ABSPATH') || exit;

/**
 * Class ApiRouteException
 *
 * @since 1.0.0
 */
class ApiRouteException extends Exception
{
	/**
	 * Constructor
	 *
	 * @param string  $message exception message.
	 * @param integer $code code.
	 */
	public function __construct($message = '', $code = 0)
	{
		parent::__construct($message, $code);
	}
}
