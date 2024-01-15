import axios from 'axios';

describe('GET /', () => {
  it('should return a messages', async () => {
    const res = await axios.get(`/v1/`);

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});
