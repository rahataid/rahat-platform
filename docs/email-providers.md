# Email providers

The Rahat email service uses the existing database-backed `SMTP` settings by
default. Set `EMAIL_PROVIDER` to `nodemailer`, `sendgrid`, `mailgun`, or
`custom` to select a provider. Set `EMAIL_FALLBACK_PROVIDERS` to a
comma-separated list of provider names to try in order if delivery fails.
The first successful provider stops the sequence; if all fail, the operation
fails. A network timeout can occur after a provider accepted a message, so
fallback delivery can produce duplicates.

Set `EMAIL_FROM` to a sender address accepted by the selected providers. If
omitted, the service uses `SMTP.USERNAME` from the existing settings.

| Provider | Required configuration |
| --- | --- |
| `nodemailer` | Existing `SMTP` setting: `HOST`, `PORT`, `SECURE`, `USERNAME`, `PASSWORD` |
| `sendgrid` | `SENDGRID_API_KEY` |
| `mailgun` | `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`; optional `MAILGUN_REGION` is `us` (default) or `eu` |
| `custom` | `EMAIL_CUSTOM_URL` (HTTPS), `EMAIL_CUSTOM_TOKEN` |

The custom provider sends a JSON POST with `from`, `to` (a string or array),
`subject`, `text`, and optional `html`, and authenticates with a bearer token.
The endpoint should return a 2xx status only when it accepts the message.
HTTP providers use a 15-second timeout and do not follow redirects. Keep provider credentials in your
deployment's secret manager rather than committing them to the repository.
