=== Streamery Forms ===
Contributors: streamery
Donate link: https://ko-fi.com/streamery
Tags: forms, contact form, form builder, block editor, webhook
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Build forms directly in the block editor, collect submissions in a built-in inbox, and send them on by email or webhook.

== Description ==

Streamery Forms is a form builder for the WordPress block editor. You compose a form the same way you compose any other page — by adding blocks — and every submission is stored in an inbox inside your WordPress admin, so nothing depends on an email actually arriving.

**Building forms**

* 17 field blocks: text, email, number, textarea, select, radio, checkbox, date & time, slider, file upload, and more
* Multi-step forms with progress display and step navigation
* Conditional logic — show or hide fields based on what has been filled in
* Ready-made starter templates, or start from an empty form
* Styling through the block editor's own controls (colours, spacing, borders, typography)

**Handling submissions**

Every submission runs through a chain of providers:

* **Database** — always active. Stores the submission in the inbox before anything else runs, so a failing integration can never cost you a lead.
* **Email** — notification email with a customisable HTML template and placeholders for form values.
* **Webhook** — sends the submission to any HTTPS endpoint, with optional HMAC signing, several authentication methods, custom headers, and field mapping.

**Inbox**

* Read, search, and filter submissions
* Folders, labels, and read/unread status
* Multiple mailboxes, with each form routed to the one you choose
* Trash with restore

**Spam protection**

* Honeypot field
* CAPTCHA (FriendlyCaptcha or Google reCAPTCHA), verified on the server
* Per-IP rate limiting
* Minimum time between a form being rendered and submitted

All of these are enforced on the server. A submission cannot bypass them by talking to the REST endpoint directly.

**Privacy**

* Storing the submitter's IP address can be switched off per form
* Optional retention period per form, after which submissions are deleted automatically
* No data is sent anywhere except the providers you configure yourself

== Third-Party Services ==

Streamery Forms does not contact any external service on its own. The following are optional and only ever active once **you** configure them.

**Google reCAPTCHA** — only when you enable reCAPTCHA and enter your keys under Streamery Forms → Settings. When enabled, the reCAPTCHA script is loaded from Google on pages containing a form, and the visitor's CAPTCHA response token plus their IP address are sent to Google for verification on submit.
Service: https://www.google.com/recaptcha/
Terms: https://policies.google.com/terms
Privacy policy: https://policies.google.com/privacy

**FriendlyCaptcha** — only when you enable FriendlyCaptcha and enter your keys. The widget itself is bundled with the plugin and is not loaded from a third party. On submit, the visitor's CAPTCHA solution is sent to the FriendlyCaptcha API for verification.
Service: https://friendlycaptcha.com/
Terms: https://friendlycaptcha.com/legal/terms/
Privacy policy: https://friendlycaptcha.com/legal/privacy/

**Webhook provider** — only when you add a webhook feed. Submissions of the forms you assign it to are sent to the URL **you** configure. That endpoint is yours; where the data goes and how it is handled is determined entirely by the address you enter. No default endpoint exists and nothing is sent anywhere unless you set one up.

== Source Code ==

The JavaScript and CSS in `assets/admin/dist/` and `assets/blocks/` are compiled. The human-readable source is public at:

https://github.com/streamery/streamery-forms

* `src/admin/`, `src/components/`, `src/lib/` — the admin app (React), built with Vite (`vite.admin.config.js`) into `assets/admin/dist/`
* `src/blocks/` — the form blocks, built with `@wordpress/scripts` (`webpack.config.js`) into `assets/blocks/`
* `assets/admin/deactivate.js` and `assets/admin/deactivate.css` are not compiled

To build the plugin from source:

1. `composer install --no-dev --optimize-autoloader`
2. `npm ci`
3. `npm run build`

Bundled third-party libraries (all MIT-licensed; full list in `package.json` and `composer.json`):

* friendly-challenge — https://github.com/FriendlyCaptcha/friendly-challenge
* CodeMirror / @uiw/react-codemirror — https://github.com/uiwjs/react-codemirror
* noUiSlider — https://github.com/leongersen/noUiSlider
* Radix UI — https://github.com/radix-ui/primitives
* React Router — https://github.com/remix-run/react-router
* Recharts — https://github.com/recharts/recharts
* date-fns — https://github.com/date-fns/date-fns
* Zod — https://github.com/colinhacks/zod
* vite-for-wp (adapted in `libs/assets.php`) — https://github.com/kucrut/vite-for-wp
* wp-eloquent (Composer, in `vendor/`) — https://github.com/prappo/wp-eloquent

== Installation ==

1. Upload the plugin to `/wp-content/plugins/streamery-forms/`, or install it through Plugins → Add New.
2. Activate it through the Plugins screen.
3. Edit a page or post, add the **Form** block, and add field blocks inside it.
4. Open **Form Settings** from the block toolbar to choose a mailbox and add providers.
5. Submissions appear under **Streamery Forms → Inbox**.

== Frequently Asked Questions ==

= Do I need to configure anything before the first form works? =

No. The database provider is always active, so submissions land in the inbox as soon as you publish a form. Email and webhook delivery are optional additions.

= Where are file uploads stored? =

In `wp-content/uploads/streamery-forms/`. The directory is protected against script execution, uploads are restricted to a server-side list of allowed file types, and an upload is only ever linked to a submission through a single-use token — a submission cannot reference some other file on your site.

= Can editors manage submissions without being administrators? =

Yes. Editors can read and manage inbox entries. Settings that affect the whole site — SMTP, provider feeds, mailboxes, CAPTCHA keys — remain administrator-only.

= How can I support Streamery Forms? =

Streamery Forms is free, with no pro version and no locked features. The easiest way to help is a review here on WordPress.org or a translation on translate.wordpress.org. If you would like to support development, you can buy a coffee at [ko-fi.com/streamery](https://ko-fi.com/streamery).

The plugin shows a small support link on its settings screen and, once, after 50 collected submissions. Administrators can dismiss it, and developers can remove it entirely with `add_filter( 'streamery-forms/support_links', '__return_empty_array' );`. No request is ever made to a donation platform, and nothing is shown to site visitors.

= What happens to my data if I delete the plugin? =

By default, nothing: your submissions, mailboxes, and providers are kept, so deleting and reinstalling does not lose anything. If you want everything removed, enable "Delete all data on uninstall" in the settings before deleting the plugin. Plugin options — including the stored SMTP password — are always removed on uninstall.

= Does the plugin work with page caching? =

Yes. Form submission does not depend on a per-page nonce that could expire in a cache; spam protection is handled by honeypot, timing, rate limiting, and CAPTCHA instead.

= Can I add my own provider? =

Yes. Provider classes are registered through the `streamery-forms/available_providers` filter, so an add-on plugin can register its own without modifying this one.

== Screenshots ==

1. Building a form in the block editor with field blocks
2. The Form Settings dialog — storage, providers, spam protection, privacy
3. The inbox with folders, labels, and submission details
4. Provider configuration, including the webhook feed
5. A published form on the front end

== Changelog ==

= 1.0.1 =
* Fix: Multi-step forms now scroll back to the top of the form when moving to the next or previous step.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.1 =
Multi-step forms scroll back to the top of the form on step change.

= 1.0.0 =
Initial release.
