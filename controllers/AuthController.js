import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class AuthController {
  static async getConnect(req, res) {
    // Get Authorization header / verify not empty and of Basic type
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic')) {
      return res.status(401).json({ error: 'Missing or Invalid Authorization header' });
    }

    // Get authHeader value
    const base64Credentials = authHeader.split(' ')[1];

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

    // Hash password and check if correct
    const hashedPassword = sha1(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create user token
    const token = uuidv4();

    // Create key
    const authToken = `auth_${token}`;

    // Store key in Redis
    try {
      await redisClient.set(authToken, user._id.toString(), 24 * 60 * 60);
      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    // Get user token
    const userToken = req.headers['x-token'];
    if (!userToken) {
      return res.status(401).json({ error: 'Unathorized' });
    }

    // Create key using token
    const key = `auth_${userToken}`;

    // Handle: invalid token
    const validToken = await redisClient.get(key);
    if (!validToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete token
    try {
      await redisClient.del(key);
      return res.status(204).json({});
    } catch (error) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
