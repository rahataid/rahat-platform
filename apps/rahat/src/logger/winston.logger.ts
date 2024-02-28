import { createLogger, format, transports } from 'winston';

// custom log display format
const customFormat = format.printf((info) => {
  return `${info.timestamp} ${info.level}: [${info.context || 'RumsanApp'}] ${
    info.message
  }`;
});

const options = {
  file: {
    filename: 'error.log',
    level: 'error',
  },
  console: {
    level: 'silly',
  },
};

// for development environment
const devLogger = {
  format: format.combine(
    format((info) => ({ ...info, level: info.level.toUpperCase() }))(),
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD, HH:mm:ss' }),
    format.errors({ stack: true }),
    customFormat,
  ),
  transports: [new transports.Console(options.console)],
};

// for production environment
const prodLogger = {
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  ),
  transports: [
    new transports.File(options.file),
    new transports.File({
      filename: 'combine.log',
      level: 'info',
    }),
  ],
};

// export log instance based on the current environment
const envLogger =
  process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

export const loggerInstance = createLogger(envLogger);
