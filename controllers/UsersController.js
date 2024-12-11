/* eslint-disable import/no-named-as-default */
import sha1 from 'sha1';
import Queue from 'bull/lib/queue.js';
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';

const userQueue = new Queue('email sending');

export default class UsersController {
  static async postNew(req, res) {
    const email = req.body ? req.body.email : null;
    const password = req.body ? req.body.password : null;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const usersCollection = dbClient.database.collection('users');

    const user = await usersCollection.findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    // New user
    const newUser = { email, password: sha1(password) };
    const insertionInfo = await usersCollection.insertOne(newUser);
    const userId = insertionInfo.insertedId.toString();

    userQueue.add({ userId });
    res.status(201).json({ email, id: userId });
  }

  static async getMe(req, res) {
    const userToken = req.headers['X-Token'];
    if (!userToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create key
    const key = `auth_${userToken}`;

    // Get user id
    const userId = await redisClient.get(key);

    // Get user from mongodb
    const usersCollection = dbClient.database.collection('users');
    const user = await usersCollection.findOne({ id: userId });

    // Return user email and id
    return res.status(200).json({ email: user.email, userId });
  }
}
