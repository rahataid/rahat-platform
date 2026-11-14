# International beneficiary phone imports

Tool imports accept valid international numbers with a `+` country code and
store them in E.164 format. Numbers without a country code are interpreted
using `BENEFICIARY_DEFAULT_PHONE_REGION`, an ISO 3166-1 alpha-2 region code
(default `NP` for compatibility with existing Nepali imports). Set the region
to the relevant country for national-format data, or provide international
numbers explicitly for mixed-country imports.

Phone numbers must be text so spreadsheet tools preserve the leading `+`.
Missing phones remain optional in temporary imports; invalid numbers reject
the import with a row number before wallets are generated.
