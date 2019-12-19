import request from 'supertest';
import { subDays, startOfHour, addDays } from 'date-fns';

import app from '../../src/app';
import truncate from '../util/truncate';
import factory from '../factories';
import { getTokenProvider, getToken } from '../getToken';

const createAppointment = async (
  token,
  id = 2,
  isProvider = true,
  date = null
) => {
  let appointment;

  if (date) {
    appointment = await factory.attrs('Appointment', {
      date: startOfHour(subDays(date, 2)),
    });
  } else {
    appointment = await factory.attrs('Appointment');
  }

  const provider = await factory.create('User', {
    password: '123456',
    provider: isProvider,
    id,
  });

  const response = await request(app)
    .post('/appointments')
    .set('Authorization', `bearer ${token}`)
    .send({ ...appointment, provider_id: provider.id });

  return response;
};

describe('Provider', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to list appointments', async () => {
    const token = await getTokenProvider();

    const { status } = await request(app)
      .get('/appointments')
      .set('Authorization', `bearer ${token}`);

    expect(status).toBe(200);
  });

  it('should be able to create a new appointment', async () => {
    const token = await getToken();

    const { status } = await createAppointment(token);

    expect(status).toBe(200);
  });

  it('should not be able to create a new appointment when user is not a provider', async () => {
    const token = await getToken();

    const { status } = await createAppointment(token, 2, false);

    expect(status).toBe(401);
  });

  it('should not be able to create a new appointment when user and provider is the same person', async () => {
    const token = await getTokenProvider();
    const appointment = await factory.attrs('Appointment');

    const { status } = await request(app)
      .post('/appointments')
      .set('Authorization', `bearer ${token}`)
      .send({ ...appointment, provider_id: 1 });

    expect(status).toBe(401);
  });

  it('should not be able to create a new appointment when date is a past date', async () => {
    const token = await getToken();

    const { status } = await createAppointment(token, 2, true, new Date());

    expect(status).toBe(400);
  });

  it('should not be able to create a new appointment when date is not available', async () => {
    const token = await getToken();
    const appointment = await factory.attrs('Appointment');

    const provider = await factory.create('User', {
      password: '123456',
      provider: true,
      id: 2,
    });

    await request(app)
      .post('/appointments')
      .set('Authorization', `bearer ${token}`)
      .send({ ...appointment, provider_id: provider.id });

    const response = await request(app)
      .post('/appointments')
      .set('Authorization', `bearer ${token}`)
      .send({ ...appointment, provider_id: provider.id });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a new appointment when provider id is not provided', async () => {
    const token = await getToken();
    const appointment = await factory.attrs('Appointment');

    const { status } = await request(app)
      .post('/appointments')
      .set('Authorization', `bearer ${token}`)
      .send(appointment);

    expect(status).toBe(400);
  });

  it('should be able to delete an appointment', async () => {
    const token = await getToken();

    const { body: appointment } = await createAppointment(
      token,
      2,
      true,
      addDays(new Date(), 5)
    );

    const response = await request(app)
      .delete(`/appointments/${appointment.id}`)
      .set('Authorization', `bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should not be able to delete an appointment when the appointment time is 2 hours close ou less', async () => {
    const token = await getToken();

    const { body: appointment } = await createAppointment(token, 2, true);

    const { status } = await request(app)
      .delete(`/appointments/${appointment.id}`)
      .set('Authorization', `bearer ${token}`);

    expect(status).toBe(401);
  });

  it('should not be able to delete an appointment when it was created for another user', async () => {
    const tokenUser1 = await getToken();
    const user = await factory.attrs('User', {
      id: 2,
    });

    await request(app)
      .post('/users')
      .send(user);

    const { body } = await request(app)
      .post('/sessions')
      .send(user);

    const tokerUser2 = body.token;

    const { body: appointment } = await createAppointment(tokenUser1, 3, true);

    const { status } = await request(app)
      .delete(`/appointments/${appointment.id}`)
      .set('Authorization', `bearer ${tokerUser2}`);

    expect(status).toBe(401);
  });
});
