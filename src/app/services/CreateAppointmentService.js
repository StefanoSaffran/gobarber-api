import { startOfHour, parseISO, isBefore, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Notification from '../schemas/Notification';

import Cache from '../../lib/Cache';

import ApiError from './ApiError';

class CreateAppointmentService {
  async run({ provider_id, user_id, date }) {
    /**
     * Check if provider_id is a provider
     */
    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!checkIsProvider) {
      throw new ApiError(
        401,
        'You can only create appointments with providers'
      );
    }

    if (provider_id === user_id) {
      throw new ApiError(
        401,
        'You can not create an appointments with yourself'
      );
    }

    const hourStart = startOfHour(parseISO(date));
    /**
     * Check for past dates
     */
    if (isBefore(hourStart, new Date())) {
      throw new ApiError(400, 'Past dates are not permitted');
    }

    /**
     * Check date availability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      throw new ApiError(400, 'Appointment date is not available');
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(user_id);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      {
        locale: ptBR,
      }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    /**
     * Invalidate cache
     */
    await Cache.invalidatePrefix(`user:${user_id}:appointments`);

    return appointment;
  }
}

export default new CreateAppointmentService();
