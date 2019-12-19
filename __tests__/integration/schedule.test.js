import request from 'supertest';

import app from '../../src/app';
import truncate from '../util/truncate';
import { getTokenProvider, getToken } from '../getToken';

describe('Schedule', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to list schedules', async () => {
    const token = await getTokenProvider();

    const response = await request(app)
      .get('/schedule')
      .send({ date: new Date() })
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should not be able to list schedules when user is not a provider', async () => {
    const token = await getToken();

    const response = await request(app)
      .get('/schedule')
      .send({ date: new Date() })
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
