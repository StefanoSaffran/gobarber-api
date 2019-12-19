import request from 'supertest';

import app from '../../src/app';
import truncate from '../util/truncate';
import { getToken } from '../getToken';

describe('Provider', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to list providers', async () => {
    const token = await getToken();

    const response = await request(app)
      .get('/providers')
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
