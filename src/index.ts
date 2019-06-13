import axios from 'axios';

interface Target {
  readonly url: string;
  readonly method:
    | 'head'
    | 'get'
    | 'GET'
    | 'delete'
    | 'DELETE'
    | 'HEAD'
    | 'options'
    | 'OPTIONS'
    | 'post'
    | 'POST'
    | 'put'
    | 'PUT'
    | 'patch'
    | 'PATCH'
    | undefined;
}

interface TruePromise {
  readonly resolve: any;
  readonly reject: any;
}

interface Request {
  readonly url: string;
  readonly method: string | undefined;
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
  targets: Target[];
  poolSize: number;
  defaults: object = {};

  constructor(targets: Target[], poolSize: number) {
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
   */
  async processTask(truth: TruePromise): Promise<any> {
    const target: Target | undefined = this.targets.shift();
    if (!target) {
      return;
    }

    const options = {
      ...target,
      ...this.defaults,
    };
    const startTime = Date.now();
    // make request and catch errors also
    const resp = await axios.request(options).catch((e: any) => e);
    const duration = RequestPool.prettyTime(Date.now() - startTime);

    // Add responses/errors and resolve promise chain when all fulfilled
    this.responses.push(new Response(options, resp, duration));
    if (this.responses.length === this.total) {
      return truth.resolve(this.responses);
    }

    return this.processTask(truth);
  }

  /**
   * start the pool
   * @return Promise<Response[]>
   */
  start(): Promise<Response[]> {
    return new Promise((resolve, reject) => {
      const truth: TruePromise = { resolve, reject };

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

export { RequestPool, Response, Request, Target };
