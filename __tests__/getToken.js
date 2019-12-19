import request from 'supertest';

import app from '../src/app';
import factory from './factories';

export const getTokenProvider = async () => {
  const user = await factory.attrs('User', {
    provider: true,
    id: 1,
  });

  await request(app)
    .post('/users')
    .send(user);

  const { body } = await request(app)
    .post('/sessions')
    .send(user);

  return body.token;
};

export const getToken = async () => {
  const user = await factory.attrs('User', {
    id: 1,
  });

  await request(app)
    .post('/users')
    .send(user);

  const { body } = await request(app)
    .post('/sessions')
    .send(user);

  return body.token;
};
