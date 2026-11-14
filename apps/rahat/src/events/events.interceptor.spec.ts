import { Controller, Sse } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { ResponseTransformInterceptor } from '@rahataid/extensions';
import { firstValueFrom, of } from 'rxjs';

@Controller()
class TestController {
  @Sse('events')
  stream() {}
  ordinary() {}
}

describe('SSE response transformation', () => {
  const interceptor = new ResponseTransformInterceptor();
  const context = (handler: () => void) =>
    new ExecutionContextHost([{ query: {} }], TestController, handler);

  it('preserves the SSE event envelope', async () => {
    const event = { type: 'phase', data: '{"id":1}' };
    const result = interceptor.intercept(context(TestController.prototype.stream), { handle: () => of(event) });
    expect(await firstValueFrom(result)).toEqual(event);
  });

  it('continues wrapping ordinary API responses', async () => {
    const result = interceptor.intercept(context(TestController.prototype.ordinary), { handle: () => of({ id: 1 }) });
    expect(await firstValueFrom(result)).toMatchObject({ success: true, data: { id: 1 } });
  });
});
