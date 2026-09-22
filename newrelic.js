'use strict'

/**
 * New Relic agent configuration
 * Docs: https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration
 */
exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'Rahat Platform'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
  },
  allow_all_headers: true,
  attributes: {
    enabled: true,
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f',
  },
  error_collector: {
    enabled: true,
  },
}
