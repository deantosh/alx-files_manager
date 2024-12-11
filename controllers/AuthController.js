import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

export default class AuthController {
  static async getConnect(req, res) {
    // Get Authorization header / verify not empty and of Basic type
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic')) {
      return res.status(401).json({ error: 'Missing or Invalid Authorization header' });
    }

    // Get authHeader value
    const base64Credentials = authHeader.split()[1];

    // Decode Base64 Header value to <email>:<password>
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');

    // Get email and password value
    const [email, password] = decodedCredentials.split(':');

    // Find user using email
    const usersCollection = dbClient.database.collection('users');
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create user token
    const token = uuidv4();

    // Create key
    authToken = `auth_${token}`;

    // Store key in Redis
    result = await redisClient.set(authToken, user.id, 24 * 60 * 60);
    if (result) {
      return res.status(200).json({ token });
    }
  }

  static async getDisconnect(req, res) {
    // Get user token
    const userToken = req.headers['X-Token'];
    if (!userToken) {
      return res.status(401).json({ error: 'Unathorized' });
    }

    // Create key using token
    key = `auth_${userToken}`;

    // Delete token
    result = await redisClient.del(key);
    if (result) {
      return res.status(204).json({});
    }
  }
}
