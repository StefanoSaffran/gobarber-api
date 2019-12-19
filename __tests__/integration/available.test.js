import request from 'supertest';

import app from '../../src/app';
import truncate from '../util/truncate';
import factory from '../factories';
import { getTokenProvider, getToken } from '../getToken';

const createAppointment = async token => {
  const appointment = await factory.attrs('Appointment');
  const provider = await factory.create('User', {
    password: '123456',
    provider: true,
    id: 2,
  });

  const response = await request(app)
    .post('/appointments')
    .set('Authorization', `bearer ${token}`)
    .send({ ...appointment, provider_id: provider.id });

  return response.body;
};

describe('Available', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to list all available times', async () => {
    const token = await getTokenProvider();
    const user = await factory.attrs('User', {
      password: '123456',
      id: 1,
    });

    const date = new Date();

    const response = await request(app)
      .get(`/providers/${user.id}/available`)
      .query({ date: date.getTime() })
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should not be able to list all available times when date is not provided', async () => {
    const token = await getTokenProvider();
    const user = await factory.attrs('User', {
      password: '123456',
      id: 1,
    });

    const response = await request(app)
      .get(`/providers/${user.id}/available`)
      .query({ date: '' })
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should be able to find a created appointment when search for all available times', async () => {
    const token = await getToken();

    await createAppointment(token);

    const date = new Date();

    const response = await request(app)
      .get('/providers/2/available')
      .query({ date: date.getTime() })
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
