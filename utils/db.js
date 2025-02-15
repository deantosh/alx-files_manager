// Module defines a class DBClient
import pkg from 'mongodb';

const { MongoClient } = pkg;

class DBClient {
  // Initialize the db
  constructor() {
    // Get env variables
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || 27017;
    const dbName = process.env.DB_DATABASE || 'files_manager';

    // Create database URI
    const uri = `mongodb://${dbHost}:${dbPort}`;

    // create a client
    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Flag - to check for connection
    this.connected = false;

    // Select database
    this.database = null;
    this.client.connect()
      .then(() => {
        this.database = this.client.db(dbName);
        this.connected = true;
      })
      .catch((err) => {
        console.log('Error connecting to MongoDB:', err);
      });
  }

  // Instance method: check if connection to db is successful or not
  isAlive() {
    return this.connected;
  }

  // Async method: returns number of documents in user collection
  async nbUsers() {
    const collection = this.database.collection('users');
    return collection.countDocuments();
  }

  // Async method: returns number of documents in files collection
  async nbFiles() {
    const collection = this.database.collection('files');
    return collection.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
