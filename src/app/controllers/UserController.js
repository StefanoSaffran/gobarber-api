import * as Yup from 'yup';
import aws from 'aws-sdk';

import fs from 'fs';
import { resolve } from 'path';
import { promisify } from 'util';

import User from '../models/User';
import File from '../models/File';

const s3 = new aws.S3();

class UserController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    return User.findOne({ where: { email: req.body.email } }).then(user => {
      /**
       * Check if User already exists
       */
      if (user) {
        return res.status(400).json({ error: 'User already exists.' });
      }

      return User.create(req.body).then(createdUser =>
        res.json({
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          provider: createdUser.provider,
        })
      );
    });
  }

  async update(req, res) {
    /**
     * Check if the user sent the oldPassword, if so, make the password and the
     * confirmPassword required, if not, make them optional.
     */
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'validation fails' });
    }

    const { email, oldPassword, password, confirmPassword } = req.body;

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

    if (!oldPassword && (password || confirmPassword)) {
      return res.status(401).json({ error: 'Password is required.' });
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
