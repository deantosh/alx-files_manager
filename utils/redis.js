// Module contains the class RedisClient
const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: '127.0.0.1',
      port: '6379'
    });

    // Handle errors when creating redis instance
    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  // Instance method: checks if redis connection is a success
  isAlive() {
    // Check connection status
    return this.client.isOpen;
  }

  // Async method: takes key and returns its corresponding redis value
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      return null;
    }
  }

  // Async method: takes key, value and duration and store in redis
  async set(key, value, duration) {
    try {
      await this.client.set(key, value, { EX: duration });
      console.log(key);
    } catch (err) {
      console.error(`Error setting key "${key}":`, err);
    }	
  }

  // Async method: to delete key from redis
    async del(key) {
	const results = await this.client.del(key);

	if (results === 1) {
	    console.log(`Key "${key}" successfully deleted`);
	} else {
	    console.log(`Key "${key}" not found`);
	}
    }  
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
