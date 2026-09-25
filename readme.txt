=== Streamery Forms ===
Contributors: streamery
Donate link: https://ko-fi.com/streamery
Tags: forms, contact form, form builder, block editor, webhook
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.10
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

Some JavaScript and CSS in this plugin is compiled. The complete, human-readable source ships inside the plugin in the `src/` folder, together with the build configuration. Every compiled file begins with a comment naming its source folder. The same code is also public and maintained at:

https://github.com/streamery-de/streamery-forms

Compiled file → source:

* `assets/blocks/{block}/index.js`, `view.js`, `*.css` → `src/blocks/{block}/` (e.g. `assets/blocks/select/view.js` → `src/blocks/select/view.ts`), built with @wordpress/scripts (`webpack.config.js`)
* `assets/blocks/skins/default/` → `src/skins/default/`
* `assets/blocks/{number}.js` → shared, lazy-loaded chunks of the HTML email editor: currently `3024.js` from `src/components/email-template-editor/HtmlCodeEditor.tsx` and `3468.js` with the bundled CodeMirror library (see below)
* `assets/admin/dist/` → `src/admin/`, `src/components/`, `src/lib/`, `src/hooks/`, built with Vite (`vite.admin.config.js`, `tailwind.config.js`, `postcss.config.js`)
* `assets/admin/deactivate.js` and `assets/admin/deactivate.css` are not compiled

To rebuild the compiled files (Node.js 20, Composer):

1. `composer install --no-dev --optimize-autoloader`
2. `npm ci`
3. `npm run build` (runs `vite build -c vite.admin.config.js` and `wp-scripts build`)

Bundled third-party libraries (all MIT or ISC licensed; exact versions in `package-lock.json` and `vendor/composer/installed.json`):

* CodeMirror, @uiw/react-codemirror — https://github.com/codemirror/dev, https://github.com/uiwjs/react-codemirror
* friendly-challenge — https://github.com/FriendlyCaptcha/friendly-challenge
* noUiSlider — https://github.com/leongersen/noUiSlider
* dnd kit — https://github.com/clauderic/dnd-kit
* Lucide — https://github.com/lucide-icons/lucide
* Radix UI — https://github.com/radix-ui/primitives
* React Router — https://github.com/remix-run/react-router
* Recharts — https://github.com/recharts/recharts
* date-fns — https://github.com/date-fns/date-fns
* Zod — https://github.com/colinhacks/zod
* clsx — https://github.com/lukeed/clsx
* tailwind-merge — https://github.com/dcastil/tailwind-merge
* Nano Stores — https://github.com/nanostores/nanostores
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

= 1.0.10 =
* Fix: Default values now show in the frontend for input, textarea, radio, checkbox and date/time fields. They were written in a form browsers ignore.
* Fix: Leftover defaults from the old placeholder copy (e.g. a lone "M") are removed when a form is opened in the editor, so they don't suddenly appear as field values.

= 1.0.9 =
* New: "Default value" for select and radio fields: choose the preselected option or "No default".
* New: Checkbox fields get a checklist to preselect one or more options (not for consent checkboxes).
* New: Default value field for input and textarea fields.
* Fix: Select fields now actually preselect their default option.
* Fix: Typing a placeholder no longer copies its first letter into the field's value.

= 1.0.8 =
* Fix: Option images sit next to the text again in the default, toggle and badge styles. The skin's option layout overrode them and stacked image and text.

= 1.0.7 =
* New: The Field Value block can show the value in bold, independent of the text before and after it.
* New: "Image position" for checkbox and radio options in every style but cards: before or after the text.
* An option's description now sits under its label when the option has an image.

= 1.0.6 =
* New: "Field Value" block shows the current value of a form field live, e.g. in a heading, a summary column or the success screen. Supports typography, colors and spacing like the Site Title block.
* New: Steps can be nested anywhere inside a form, e.g. in one column next to a live summary.
* Fix: Conditional logic now reads the selected radio option and all checked boxes of a checkbox group.

= 1.0.5 =
* New: Conditional logic works on every block inside a form -- groups, headings, columns, images and more -- not just on fields.
* Fix: Fields inside a hidden group stay disabled even when their own condition is met, and required fields inside a conditional group no longer block submission when the group is hidden.

= 1.0.4 =
* New: "Image position" setting for checkbox and radio cards: top left, or centered without the check indicator (the selected card is marked by its border).
* Option images now have a fixed height and keep their aspect ratio instead of being cropped.

= 1.0.3 =
* New: Themes and plugins can register their own form skins with the `streamery-forms/skins` filter, including skins that extend another skin.
* New: Checkbox and radio options can show an image (top left on the Cards style).
* New: Checkbox and radio groups can offer a custom option where visitors type their own answer.
* New: "Hide label" toggle in the global field settings. The label stays available to screen readers.
* Fix: The checkbox block can be found in the block inserter again, and a plain checkbox group is its default.

= 1.0.2 =
* Fix: The required asterisk now shows on checkbox and radio groups.
* Fix: Checkbox groups accept multiple selections.
* Every compiled JavaScript and CSS file now starts with a comment pointing to its source.

= 1.0.1 =
* Fix: Multi-step forms now scroll back to the top of the form when moving to the next or previous step.

= 1.0.0 =
* Initial release.

== Upgrade Notice ==

= 1.0.10 =
Default values now reach the frontend. Open and update pages with forms once so their fields are saved in the new format.

= 1.0.9 =
Default values for select, radio, checkbox, input and textarea fields. Check inputs whose placeholder was copied into the value.

= 1.0.8 =
Fixes the layout of option images next to the text.

= 1.0.7 =
Bold value option for the Field Value block and image position before/after the text for checkbox and radio options.

= 1.0.6 =
New Field Value block, nested steps, and conditional logic based on radio and checkbox fields works correctly.

= 1.0.5 =
Conditional logic for any block inside a form. Re-save existing forms that use conditional groups.

= 1.0.4 =
Centered image cards for checkbox/radio groups; option images are no longer cropped.

= 1.0.3 =
Custom skins via filter, images and a custom option for checkbox/radio groups, and a "Hide label" field setting.

= 1.0.2 =
Fixes required checkbox/radio groups and multi-select checkboxes.

= 1.0.1 =
Multi-step forms scroll back to the top of the form on step change.

= 1.0.0 =
Initial release.
