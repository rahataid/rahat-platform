# Beneficiary phone numbers

Beneficiary creation, updates that supply a phone number, and bulk or queued
imports require E.164 format: a leading `+`, a nonzero country-code digit, and
up to 15 digits total (for example `+9779812345678`). Phone numbers must be
supplied as text so spreadsheet software preserves the leading `+`.

The application does not guess country codes for ordinary beneficiary
creation or imports. Update input files and integrations before deploying this
validation; existing records are not automatically migrated.
