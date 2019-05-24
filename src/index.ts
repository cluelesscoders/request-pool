import axios from 'axios';

interface ITarget {
  readonly url: string;
  readonly method: string;
}

interface Request {
  readonly url: string;
  readonly method: string;
  readonly data?: object;
  readonly headers?: object;
}

class Response {
  readonly error: boolean;
  readonly response: any;
  readonly duration: string;
  readonly request: Request;

  constructor(request: Request, response: any, duration: string) {
    this.error = response instanceof Error;
    this.response = response;
    this.request = request;
    this.duration = duration;
  }
}

class RequestPool {
  responses: any[];
  total: number;
  targets: ITarget[];
  poolSize: number;
  defaults: object = {};

  constructor(targets: ITarget[], poolSize: number) {
    this.responses = [];
    this.total = targets.length;
    this.targets = [...targets];
    this.poolSize = poolSize;
  }

  setDefaults(options: any) {
    this.defaults = options;
  }

  /**
   * make requests and store responses
   * @param truth
   * @param response
   */
  async processTask(truth: any, response: any = null) {
    if (response !== null) {
      this.responses.push(response);
    }

    if (this.responses.length === this.total) {
      return truth.resolve(this.responses);
    }

    const target: ITarget | undefined = this.targets.shift();
    if (!target) {
      return;
    }

    // make request
    const { url, method }: any = target;
    const options = {
      url,
      method,
      ...this.defaults,
    };
    const startTime = Date.now();
    try {
      const resp = await axios.request(options);
      const duration = RequestPool.prettyTime(Date.now() - startTime);
      this.processTask(truth, new Response(options, resp, duration));
    } catch (e) {
      const duration = RequestPool.prettyTime(Date.now() - startTime);
      this.processTask(truth, new Response(options, e, duration));
    }
  }

  /**
   * start the pool
   * @return Promise<Response[]>
   */
  start(): Promise<Response[]> {
    return new Promise((resolve, reject) => {
      const truth = { resolve, reject };

      if (!this.targets || this.targets.length === 0) {
        return reject(new Error('no targets found'));
      }

      const limit = Math.min(this.poolSize, this.targets.length);

      // fill pool with limit
      for (let i = 0; i < limit; i += 1) {
        this.targets[i] && this.processTask(truth);
      }
    });
  }

  /**
   * convert time in ms or sec
   * @param duration
   */
  static prettyTime(duration: any) {
    if (duration < 1000) return `${duration} ms`;
    /* istanbul ignore next */
    return `${Math.floor(duration / 1000)} sec`;
  }
}

export { RequestPool, Response, Request, ITarget };
