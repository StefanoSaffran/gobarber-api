import faker from 'faker';
import { factory } from 'factory-girl';
import { startOfHour, addHours } from 'date-fns';

import User from '../src/app/models/User';
import Appointment from '../src/app/models/Appointment';

factory.define('User', User, () => ({
  name: faker.name.findName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
}));

factory.define('Appointment', Appointment, () => ({
  date: startOfHour(addHours(new Date(), 1)),
}));

export default factory;
