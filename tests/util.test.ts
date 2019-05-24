import { RequestPool, ITarget } from '../src/request-pool-util';
import axiosMock from '../__mocks__/axios';

jest.mock('axios');

describe('Request Pool', () => {
  const targets: ITarget[] = [
    { url: 'http://testurl1/', method: 'BAN' },
    { url: 'http://testurl2/', method: 'BAN' },
    { url: 'http://testurl3/', method: 'REFRESH' },
    { url: 'http://testurl4/', method: 'REFRESH' },
  ];

  beforeEach(() => axiosMock.reset());

  it('happy flow', async () => {
    const reqPool = new RequestPool(targets, 2);
    const responses = await reqPool.start();

    expect(axiosMock.request).toBeCalledTimes(4);
    expect(responses.length).toEqual(targets.length);
    expect(responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error: false,
        }),
      ])
    );
  });

  it('fails when no targets given', async () => {
    const reqPool = new RequestPool([], 2);
    expect(reqPool.start()).rejects.toEqual(new Error('no targets found'));
  });

  it('when all requests fail', async () => {
    axiosMock.rejects();

    const reqPool = new RequestPool(targets, 2);
    const responses = await reqPool.start();

    expect(axiosMock.request).toBeCalledTimes(4);
    expect(responses.length).toEqual(targets.length);
    expect(responses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error: true,
        }),
      ])
    );
  });

  it('when few requests fail', async () => {
    // move odd requests fail
    const fn = (n: number) => n % 2 === 0;
    axiosMock.resolveWhen(fn);

    const reqPool = new RequestPool(targets, 2);
    const responses = await reqPool.start();

    expect(axiosMock.request).toBeCalledTimes(4);
    expect(responses.length).toEqual(targets.length);
    for (let i = 0; i < targets.length; i += 1) {
      expect(responses[i].error).toBe(!fn(i + 1));
    }
  });

  it('working by setting defaults for axios request', async () => {
    const fn = (n: number) => n % 2 === 0;
    axiosMock.resolveWhen(fn);

    const reqPool = new RequestPool(targets, 1);
    const options = {
      headers: {
        TEST: 'test',
      },
    };
    reqPool.setDefaults(options);
    const responses = await reqPool.start();

    expect(axiosMock.request).toBeCalledTimes(4);
    expect(axiosMock.request).toBeCalledWith(
      expect.objectContaining({
        headers: options.headers,
      })
    );
    expect(responses.length).toEqual(targets.length);
    for (let i = 0; i < targets.length; i += 1) {
      const shouldPass = fn(i + 1);
      expect(responses[i].error).toBe(!shouldPass);
    }
  });
});
