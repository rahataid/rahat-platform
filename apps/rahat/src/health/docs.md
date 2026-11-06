# Rahat Core health checks

## Endpoint

`GET /v1/health` returns an overall `up` or `degraded` status and per-service
statuses. It is public; a valid `Authorization: Bearer <JWT>` receives the
full diagnostic response. Database and Redis connection URLs are never
included in the response because they contain credentials. Invalid or missing
tokens receive the sanitized response, not an authentication error. The
standard response is wrapped in `{ "success": true, "data": ... }`; use
`?raw=true` to bypass the wrapper. Monitor the body status, since a degraded
health result is still an HTTP success.

## Probes and operation

The endpoint checks PostgreSQL, Redis, the RPC URL from `CHAIN_SETTINGS`, and
the WOM and SMS Voucher microservices. The microservice probes use
`WOM_PROJECT_ID` and `SMS_VOUCHER_PROJECT_ID`; RPC and microservice requests
time out after five seconds.

Checks run at startup and every ten minutes. Endpoint requests use a Redis
result cache with a 60-second TTL. Down/restored transitions trigger email
notifications; no email is sent for an all-up initial baseline.

## Configuration

- Set `WOM_PROJECT_ID` and `SMS_VOUCHER_PROJECT_ID` to their project UUIDs.
- Set `HEALTH_ALERT_EMAILS` to comma-separated notification recipients.
- Ensure the database `CHAIN_SETTINGS` value includes `rpcUrl`.
- Configure database `SMTP` with `HOST`, `PORT`, `SECURE`, `USERNAME`, and
  `PASSWORD`. Rahat Core sends alerts directly through its SMTP-backed
  `EmailService`.
- Set database `FRONTEND_URL` to `{ "url": "...", "server": "..." }`
  for the dashboard link and environment label in alert emails.