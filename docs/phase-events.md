# Phase event stream

`GET /v1/events/phases` streams messages published to the Redis `phase:events`
channel as SSE `data` fields. Each connection owns a subscriber and closes it
when the client disconnects. Redis connection failures close the stream so
clients can reconnect.

The endpoint uses the same bearer-token and ability guards as project reads.
Native browser `EventSource` cannot send the bearer token; use an authenticated
fetch-based SSE client or an authenticated reverse proxy rather than putting
tokens in the URL.
