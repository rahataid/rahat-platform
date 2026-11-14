import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { EventsService } from './events.service';

class FakeRedis extends EventEmitter {
  static instances: FakeRedis[] = [];
  subscribe = jest.fn().mockResolvedValue(1);
  disconnect = jest.fn();

  constructor(public options: object) {
    super();
    FakeRedis.instances.push(this);
  }
}

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((options) => new FakeRedis(options)),
}));

describe('phase events', () => {
  let service: EventsService;

  beforeEach(() => {
    FakeRedis.instances = [];
    service = new EventsService(new ConfigService({
      REDIS_HOST: 'redis.example',
      REDIS_PORT: '6380',
      REDIS_PASSWORD: 'secret',
    }));
  });

  it('streams messages to each client and releases only disconnected clients', () => {
    const first = jest.fn();
    const second = jest.fn();
    const one = service.phases().subscribe(first);
    const two = service.phases().subscribe(second);
    const [redisOne, redisTwo] = FakeRedis.instances;

    expect(redisOne.options).toEqual(expect.objectContaining({
      host: 'redis.example', port: 6380, password: 'secret',
    }));
    expect(redisOne.subscribe).toHaveBeenCalledWith('phase:events');
    expect(redisTwo.subscribe).toHaveBeenCalledWith('phase:events');
    redisOne.emit('message', 'other', 'ignored');
    redisOne.emit('message', 'phase:events', '{"id":1}');
    redisTwo.emit('message', 'phase:events', '{"id":1}');
    expect(first).toHaveBeenCalledWith({ data: '{"id":1}' });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ data: '{"id":1}' });

    one.unsubscribe();
    expect(redisOne.disconnect).toHaveBeenCalledTimes(1);
    expect(redisOne.listenerCount('message')).toBe(0);
    expect(redisOne.listenerCount('error')).toBe(0);
    expect(redisTwo.disconnect).not.toHaveBeenCalled();
    redisTwo.emit('message', 'phase:events', 'second');
    expect(second).toHaveBeenCalledTimes(2);
    two.unsubscribe();
    expect(redisTwo.disconnect).toHaveBeenCalledTimes(1);
  });

  it('reports Redis failures and releases the connection', () => {
    const onError = jest.fn();
    service.phases().subscribe({ error: onError });
    const redis = FakeRedis.instances[0];
    const error = new Error('connection failed');
    redis.emit('error', error);
    expect(onError).toHaveBeenCalledWith(error);
    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
