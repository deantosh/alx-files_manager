// Module contains the class RedisClient
import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient({
      url: 'redis://127.0.0.1:6379'
    });

    this.connected = false;
      console.log('not connected');  
    // set flag to true
    this.client.on('connect', () => {
	console.log('Connected successfully');
	this.connected = true;
    });

    // Handle errors when creating redis instance
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  // Instance method: checks if redis connection is a success
  isAlive() {
    return this.connected;
  }

  // Async method: takes key and returns its corresponding redis value
  async get(key) {
    try {
      const value = await new Promise((resolve, reject) => {
        this.client.get(key, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      return value;
    } catch (err) {
      return null;
    }
  }

  // Async method: takes key, value and duration and store in redis
  async set(key, value, duration) {
    await new Promise((resolve, reject) => {
      this.client.set(key, value, 'EX', duration, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    });
  }

  // Async method: to delete key from redis
  async del(key) {
    await new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    });
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
