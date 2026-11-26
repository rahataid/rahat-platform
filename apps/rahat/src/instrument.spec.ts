describe('Sentry initialization', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDsn = process.env.SENTRY_DSN;

  afterEach(() => {
    jest.resetModules();
    jest.dontMock('@sentry/nestjs');
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = originalDsn;
    }
  });

  it('initializes Sentry in production when a DSN is configured', () => {
    const init = jest.fn();
    process.env.NODE_ENV = 'production';
    process.env.SENTRY_DSN = 'https://example.invalid/1';
    jest.doMock('@sentry/nestjs', () => ({ init }));

    jest.isolateModules(() => {
      require('./instrument');
    });

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('does not initialize Sentry outside production even when configured', () => {
    const init = jest.fn();
    process.env.NODE_ENV = 'development';
    process.env.SENTRY_DSN = 'https://example.invalid/1';
    jest.doMock('@sentry/nestjs', () => ({ init }));

    jest.isolateModules(() => {
      require('./instrument');
    });

    expect(init).not.toHaveBeenCalled();
  });

  it('does not initialize Sentry in production without a DSN', () => {
    const init = jest.fn();
    process.env.NODE_ENV = 'production';
    delete process.env.SENTRY_DSN;
    jest.doMock('@sentry/nestjs', () => ({ init }));

    jest.isolateModules(() => {
      require('./instrument');
    });

    expect(init).not.toHaveBeenCalled();
  });
});
