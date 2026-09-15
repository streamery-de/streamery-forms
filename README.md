<div align="center">
  <img src="readme-assets/logo-color.svg" alt="Streamery Forms Logo" width="400">
</div>

# Streamery Forms

A modern WordPress form builder plugin for the block editor. Create beautiful, responsive forms directly in the WordPress block editor and manage all submissions through an intuitive inbox interface.

## Features

### 🎨 Block-Based Forms
- **Form Block**: Create form containers with customizable settings and provider configuration
- **Input Block**: Text, email, and other input field types (with field transformations)
- **Textarea Block**: Multi-line text input fields
- **Select Block**: Dropdown and multi-select fields
- **Checkbox & Radio Blocks**: Single and multiple choice options
- **Date-Time Block**: Date and time picker fields
- **Slider Block**: Numeric range input (nouislider)
- **File Block**: File upload with configurable types and size limits
- **Submit Block**: Customizable submit buttons (with loading spinner)
- **Success Block**: Optional success view/modal after submission
- **Customizable Skins**: Style your forms with different visual themes

### 📋 Multi-Step Forms
- **Step Block**: Group fields into steps
- **Step Navigation**: Previous/Next navigation between steps
- **Progress Block**: Visual progress indicator
- **Save Progress Block**: Save and resume form progress

### 🛡️ Spam Protection
- **Captcha Block**: CAPTCHA challenge for form submissions
- **Honeypot Block**: Invisible honeypot field to catch bots

### 📬 Submission Management
- **Inbox Interface**: Gmail-like inbox for managing form submissions
- **Bulk Actions**: Select and act on multiple entries (status, labels, delete)
- **Entry Labels**: Organize submissions with custom color-coded labels
- **Status Management**: Track submissions with statuses (Inbox, Junk, Archive, Trash)
- **Form Filtering**: Filter submissions by form identifier
- **Real-time Updates**: Auto-refresh inbox every 5 seconds

### 🔌 Provider System
- **Extensible Architecture**: Plugin-based provider system for handling form submissions
- **Form Identifier**: Each form can be linked to providers via form identifier
- **Built-in Providers**:
  - **Email Provider**: Send form submissions via email (with SMTP support)
  - **Database Provider**: Store submissions in the database
- **Email Logging**: Log sent emails for debugging and auditing
- **Custom Providers**: Easily extend with your own providers using WordPress filters

### 🎯 Admin & Settings
- **Forms Usage Page**: Overview of where forms are used (posts/pages with embedded forms)
- **Admin Bar**: Quick access to Inbox and Settings from the WordPress admin bar
- **SMTP Settings**: Configure SMTP for reliable email delivery
- **Mailboxes**: Organize forms into different mailboxes
- **Labels**: Color-coded labels for entries
- **Debug & First Steps**: Toggle debug mode and onboarding
- **Modern Admin UI**: Built with React, TypeScript, and Tailwind CSS

## Requirements

- WordPress 5.9 or higher
- PHP 7.2 or higher
- Node.js and npm (for development)

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/streamery/streamery-forms.git
```

2. Install dependencies:
```bash
npm install
composer install
```

3. Build the plugin:
```bash
npm run build
```

4. Copy the plugin folder to your WordPress `wp-content/plugins/` directory

5. Activate the plugin through the WordPress admin panel

## Usage

### Creating a Form

1. In the WordPress block editor, search for "Form" in the block inserter
2. Add the Form block to your page
3. Configure the form settings:
   - **Form Title**: Set a title for your form
   - **Form ID**: Unique identifier for the form
   - **Mailbox**: Select which mailbox should receive submissions
   - **Providers**: Choose how submissions should be handled (Email, Database, or both)
   - **Skin**: Select a visual style for your form

4. Add form fields:
   - Add **Input** blocks for text, email, and other input types
   - Add **Textarea** blocks for multi-line text
   - Add **Select**, **Checkbox**, or **Radio** blocks for choices
   - Add **Date-Time** or **Slider** for specialized inputs
   - Add **File** block for file uploads
   - Use **Step** and **Step Navigation** for multi-step forms
   - Add **Captcha** or **Honeypot** for spam protection
   - Add a **Submit** block and optionally **Success** for completion

### Managing Submissions

1. Navigate to **Streamery Forms > Inbox** in the WordPress admin (or use the Admin Bar shortcut if enabled)
2. View all form submissions in the inbox interface
3. Use filters to:
   - Filter by form identifier
   - Filter by status (Inbox, Junk, Archive, Trash)
   - Filter by labels
4. Use bulk actions to change status, apply labels, or delete multiple entries
5. Click on any submission to view full details
6. Organize submissions with labels and status changes

### Configuring Providers & Email

1. Go to **Streamery Forms > Settings** (then **Providers** in the sidebar)
2. Configure your Email provider settings
3. Optionally configure **SMTP** (Streamery Forms > Settings > SMTP) for reliable delivery
4. Configure your Database provider settings
5. Enable or disable providers as needed
6. View **Email Logs** to debug sent emails

### Managing Mailboxes

1. Navigate to **Streamery Forms > Settings > Mailboxes**
2. Create and manage mailboxes for organizing forms
3. Assign forms to specific mailboxes

### Forms Usage & Labels

1. Go to **Streamery Forms > Forms** to see where forms are used (posts/pages with embedded forms)
2. Go to **Streamery Forms > Settings > Labels** to create custom labels with colors
3. Apply labels to submissions in the Inbox for better organization

## Development

### Setup

```bash
# Install dependencies
npm install
composer install
```

### Development Commands

```bash
# Start development servers (admin and frontend)
npm run dev

# Start admin development server only
npm run dev:admin

# Start frontend development server only
npm run dev:frontend

# Start development with WordPress server
npm run dev:server

# Build blocks for development
npm run block:start

# Build blocks for production
npm run block:build

# Build for production
npm run build
```

### Project Structure

```
streamery-forms/
├── assets/              # Built assets (generated)
├── config/             # Plugin configuration
├── database/           # Database migrations and seeders
│   ├── Migrations/     # Database schema changes
│   └── Seeders/        # Database seeding files
├── includes/           # Core PHP classes
│   ├── Admin/          # Admin functionality
│   ├── Assets/         # Asset management
│   ├── Controllers/    # Business logic controllers
│   ├── Core/           # Core plugin functionality
│   ├── Models/         # Data models (Entries, Mailboxes, Providers, etc.)
│   ├── Providers/      # Form submission providers
│   └── Routes/         # API route definitions
├── src/                # Frontend source code
│   ├── admin/          # Admin React application
│   ├── blocks/         # Gutenberg blocks
│   ├── components/     # Shared React components
│   └── hooks/          # React hooks
└── views/              # PHP templates
```

## API

### REST API Endpoints

All API endpoints are prefixed with `/streamery-forms/v1/`

#### Submissions & Entries
- `POST /submit` - Submit a form (frontend)
- `POST /entries/create` - Create an entry
- `GET /entries/get` - Get entries (with filters)
- `GET /entries/get/{id}` - Get a single entry
- `GET /entries/form-identifiers` - Get form identifiers for filtering
- `GET /entries/statuses` - Get statuses
- `POST /entries/update` - Update an entry
- `POST /entries/delete` - Delete an entry
- `POST /entries/mark-read` - Mark as read
- `POST /entries/empty-trash` - Empty trash

#### Forms
- `GET /forms/usage` - Get forms usage (posts/pages with embedded forms)

#### File Upload
- `POST /upload` - Upload file(s)
- `POST /upload-from-url` - Upload from URL

#### Mailboxes
- `GET /mailboxes/get` - Get all mailboxes
- `GET /mailboxes/get/{id}` - Get a mailbox
- `POST /mailboxes/create` - Create a mailbox
- `POST /mailboxes/update` - Update a mailbox
- `POST /mailboxes/delete` - Delete a mailbox

#### Providers
- `GET /providers/get` - Get all providers
- `GET /providers/get/{id}` - Get a provider
- `GET /providers/get-by-type/{type}` - Get providers by type
- `GET /providers/types` - Get provider types
- `POST /providers/create` - Create a provider
- `POST /providers/update` - Update a provider
- `POST /providers/delete` - Delete a provider

#### Entry Labels
- `GET /entry-labels/get` - Get all labels
- `GET /entry-labels/get/{id}` - Get a label
- `POST /entry-labels/create` - Create a label
- `POST /entry-labels/update` - Update a label
- `POST /entry-labels/delete` - Delete a label
- `POST /entry-labels/attach` - Attach label to entry
- `POST /entry-labels/detach` - Detach label from entry

#### Settings
- `GET/POST /settings/smtp` - SMTP settings
- `POST /settings/smtp/test` - Test SMTP connection
- `GET/POST /settings/debug` - Debug mode
- `GET/POST /settings/admin-bar` - Admin bar visibility
- `GET/POST /settings/skip-first-steps` - Skip onboarding
- `GET/POST /settings/charts-visible` - Charts visibility

#### Email Logs & Templates
- `GET /email-logs/get` - Get email logs
- `GET /email-logs/get/{id}` - Get single log
- `POST /email-logs/delete` - Delete log
- `POST /email-logs/delete-all` - Delete all logs
- `GET /email-templates` - Get templates
- `GET /email-templates/{name}` - Get template
- `POST /email-templates/preview` - Preview template

## Extending Streamery Forms

### Creating Custom Providers

You can create custom providers to handle form submissions in different ways:

```php
<?php

namespace YourNamespace\Providers;

use StreameryForms\Providers\AbstractProvider;

class CustomProvider extends AbstractProvider {
    
    public function get_slug(): string {
        return 'custom-provider';
    }
    
    public function get_name(): string {
        return 'Custom Provider';
    }
    
    public function handle_submission( array $data, array $config ): bool {
        // Your custom submission handling logic
        return true;
    }
}
```

Then register your provider:

```php
add_filter( 'streamery-forms/available_providers', function( $providers ) {
    $providers[] = YourNamespace\Providers\CustomProvider::class;
    return $providers;
} );
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPLv2 or later

## Support

For support, please open an issue on the [GitHub repository](https://github.com/streamery/streamery-forms).

Streamery Forms is free, with no pro version and no locked features. If it saves you time, you can support its development:

- ☕ [Buy a coffee on Ko-fi](https://ko-fi.com/streamery)
- ⭐ [Leave a review on WordPress.org](https://wordpress.org/support/plugin/streamery-forms/reviews/#new-post)

## Documentation

The `documentation/` folder contains a Next.js app for platform docs and preview. To run it locally:

```bash
cd documentation
npm install
npm run build
npm run start
```

See `documentation/DEPLOY.md` for Vercel deployment.

## Changelog

### 1.0.0
- Initial release
- Block-based form builder
- Inbox interface for submission management
- Email and Database providers
- Mailbox and label management
- Modern React admin interface

### Later updates (since README revamp)
- **Blocks**: Select, Checkbox, Radio, Date-Time, Slider, File upload, Captcha, Honeypot, Step, Step Navigation, Progress, Save Progress, Success view
- **Multi-step forms**: Step blocks, navigation, progress indicator, save/resume
- **Spam protection**: Captcha and Honeypot blocks
- **Admin**: Forms Usage page, Admin Bar shortcut, SMTP settings, Email logging
- **Inbox**: Bulk actions, improved filtering
- **API**: Forms usage, file upload, SMTP/debug/admin-bar, email logs and templates
- **i18n**: PHP-based translation system for admin and blocks
