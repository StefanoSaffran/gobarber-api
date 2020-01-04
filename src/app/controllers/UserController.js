import aws from 'aws-sdk';

import fs from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';

import User from '../models/User';
import File from '../models/File';

import Cache from '../../lib/Cache';

const s3 = new aws.S3();

class UserController {
  async store(req, res) {
    const userExists = await User.findOne({ where: { email: req.body.email } });

    /**
     * Check if User already exists
     */
    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const { id, name, email, provider } = await User.create(req.body);

    if (provider) {
      await Cache.invalidate('providers');
    }

    return res.json({
      id,
      name,
      email,
      provider,
    });
  }

  async update(req, res) {
    const { email, oldPassword, password } = req.body;

    const user = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    if (email !== user.email) {
      const userExists = await User.findOne({ where: { email } });
      /**
       * Make sure the User is updating it's on profile.
       */
      if (userExists) {
        return res.status(400).json({ error: 'User already exists.' });
      }
    }

    if (!oldPassword && password) {
      return res.status(401).json({ error: 'OldPassword is required.' });
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Password does not match' });
    }

    await user.update(req.body);

    const { avatar_id } = req.body;

    if (avatar_id && user.avatar) {
      File.destroy({
        where: {
          id: user.avatar.id,
        },
      });

      if (process.env.STORAGE_TYPE === 's3') {
        s3.deleteObject(
          {
            Bucket: process.env.BUCKET,
            Key: user.avatar.path,
          },
          async (err, data) => {
            if (err) console.log(err, err.stack);
            else console.log(data);
          }
        );
      } else {
        return promisify(fs.unlink)(
          resolve(
            __dirname,
            '..',
            '..',
            '..',
            'tmp',
            'uploads',
            user.avatar.path
          )
        );
      }
    }

    const { id, name, avatar } = await User.findByPk(req.userId, {
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json({
      id,
      name,
      email,
      avatar,
    });
  }
}
export default new UserController();
