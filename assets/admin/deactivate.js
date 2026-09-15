/**
 * Streamery Forms – deactivation dialog on the Plugins screen.
 *
 * Intercepts the plugin's "Deactivate" link and lets the user choose between
 * a plain deactivation and removing the plugin's database tables first.
 *
 * Data (plugin basename, REST URL, nonce, strings) is provided through
 * wp_localize_script() as window.streameryFormsDeactivate.
 */
( function ( $, config ) {
	'use strict';

	if ( ! config ) {
		return;
	}

	var i18n = config.i18n || {};
	var deactivateHref = '';

	function buildOption( value, label, description, checked, danger ) {
		var $input = $( '<input type="radio" name="streamery_forms_deactivate_option">' )
			.val( value )
			.prop( 'checked', checked );

		return $( '<label class="streamery-forms-deactivate__option">' )
			.toggleClass( 'is-danger', !! danger )
			.append( $input )
			.append( $( '<strong>' ).text( label ) )
			.append( $( '<p class="streamery-forms-deactivate__description">' ).text( description ) );
	}

	function buildModal() {
		var $dialog = $( '<div class="streamery-forms-deactivate__dialog" role="dialog" aria-modal="true" aria-labelledby="streamery-forms-deactivate-title">' )
			.append( $( '<h2 id="streamery-forms-deactivate-title">' ).text( i18n.title ) )
			.append( $( '<p>' ).text( i18n.question ) )
			.append(
				$( '<div class="streamery-forms-deactivate__options">' )
					.append( buildOption( 'disable', i18n.disableLabel, i18n.disableDescription, true, false ) )
					.append( buildOption( 'remove', i18n.removeLabel, i18n.removeDescription, false, true ) )
			)
			.append(
				$( '<div class="streamery-forms-deactivate__actions">' )
					.append( $( '<button type="button" class="button streamery-forms-deactivate__cancel">' ).text( i18n.cancel ) )
					.append( $( '<button type="button" class="button button-primary streamery-forms-deactivate__confirm">' ).text( i18n.confirm ) )
			);

		return $( '<div id="streamery-forms-deactivate-modal" class="streamery-forms-deactivate" hidden>' )
			.append( $( '<div class="streamery-forms-deactivate__overlay">' ).append( $dialog ) );
	}

	function responseMessage( xhr ) {
		try {
			var body = JSON.parse( xhr.responseText );
			return ( body && body.message ) || '';
		} catch ( e ) {
			return '';
		}
	}

	$( function () {
		var $modal = buildModal().appendTo( 'body' );

		function open() {
			$modal.prop( 'hidden', false );
			$modal.find( '.streamery-forms-deactivate__confirm' ).trigger( 'focus' );
		}

		function close() {
			$modal.prop( 'hidden', true );
		}

		$( document ).on( 'click', 'tr[data-plugin="' + config.pluginBasename + '"] .deactivate a', function ( e ) {
			e.preventDefault();
			deactivateHref = $( this ).attr( 'href' );
			open();
		} );

		$modal.on( 'click', '.streamery-forms-deactivate__cancel', close );

		$modal.on( 'click', '.streamery-forms-deactivate__overlay', function ( e ) {
			if ( e.target === this ) {
				close();
			}
		} );

		$( document ).on( 'keydown', function ( e ) {
			if ( 'Escape' === e.key && ! $modal.prop( 'hidden' ) ) {
				close();
			}
		} );

		$modal.on( 'click', '.streamery-forms-deactivate__confirm', function () {
			var option = $modal.find( 'input[name="streamery_forms_deactivate_option"]:checked' ).val();

			if ( 'remove' !== option ) {
				window.location.href = deactivateHref;
				return;
			}

			var $button = $( this );
			var originalText = $button.text();
			$button.prop( 'disabled', true ).text( i18n.processing );

			$.ajax( {
				url: config.restUrl,
				method: 'POST',
				beforeSend: function ( xhr ) {
					xhr.setRequestHeader( 'X-WP-Nonce', config.nonce );
				},
			} )
				.done( function ( response ) {
					var data = response && response.data ? response.data : response;

					if ( data && true === data.success ) {
						window.alert( i18n.removed );
						window.location.href = deactivateHref;
						return;
					}

					window.alert( ( data && data.message ) || i18n.removeError );
					$button.prop( 'disabled', false ).text( originalText );
				} )
				.fail( function ( xhr ) {
					window.alert( responseMessage( xhr ) || i18n.removeError );
					$button.prop( 'disabled', false ).text( originalText );
				} );
		} );
	} );
} )( jQuery, window.streameryFormsDeactivate );
