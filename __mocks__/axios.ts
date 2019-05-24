class FakeError extends Error {
  response: any;

  constructor(response: any) {
    super();
    this.response = response;
  }
}

let callCount: number = 0;
const axiosMock = {
  request: jest.fn(),
  rejects: () => {
    axiosMock.request.mockRejectedValue(new FakeError({ data: 'Fake' }));
  },
  resolveWhen: (conditionFunction: any) => {
    axiosMock.request.mockImplementation(async () => {
      callCount += 1;
      if (!conditionFunction(callCount)) {
        throw new FakeError({ data: 'Fake' });
      }
      return 'Fake 200 Response';
    });
  },
  reset: () => {
    callCount = 0;
    axiosMock.request.mockReset();
  },
};

export default axiosMock;
