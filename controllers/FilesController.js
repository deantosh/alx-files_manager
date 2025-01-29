import fs from 'fs';
import path from 'path';
import pkg from 'mongodb';
const { ObjectId } = pkg;
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js'


export default class FilesController {
  static async postUpload(req, res) {
    try {
      // Retrieve user based on token
      const userToken = req.headers['x-token'];
      if (!userToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Create key and get corresponding user id
      const key = `auth_${userToken}`;

      // Check if userId exists
      const userId = await redisClient.get(key);
      if (!userId) {
	  return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await dbClient.database.collection('users').findOne({ _id: new ObjectId(userId) });

      // Get file details
      const { name, type, parentId = '0', isPublic = false, data } = req.body

      // Validate required fields
      if (!name) {
	  return res.status(400).json({ error: 'Missing name' });
      }
      if (!type || !['folder', 'file', 'image'].includes(type)) {
          return res.status(400).json({ error: 'Missing type' });
      }
      if (!data && type !== 'folder') {
	  return res.status(400).json({ error: 'Missing data' });
      }

      // Check parentId validity
      if (parentId !== '0') {
        const parent = await dbClient.database.collection('files').findOne({ _id: new ObjectId(parentId) });
        if (!parent) {
          return res.status(400).json({ error: 'Parent not found' });
        }
	if (parent.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create new file object
      const fileDocument = {
        userId: user._id,
        name,
        type,
        parentId: parentId === '0' ? '0' : new ObjectId(parentId),
        isPublic,
      };

      if (type === 'folder') {
        // If the type is a folder, no data to save on disk
        const result = await dbClient.database.collection('files').insertOne(fileDocument);
        return res.status(201).json({ id: result.insertedId, ...fileDocument });
      } else {
	// Handle file or image
	const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
	  if (!fs.existsSync(folderPath)) {
	  fs.mkdirSync(folderPath, { recursive: true });
	}
        // Create local path in storing folder
        const localPath = path.join(folderPath, uuidv4());
        const fileContent = Buffer.from(data, 'base64');

        // Write content to file
        fs.writeFileSync(localPath, fileContent);

        // Add attribute local path to file document
        fileDocument.localPath = localPath;

        // Add fileDocument to db collection
        const result = await dbClient.database.collection('files').insertOne(fileDocument);
        return res.status(201).json({ id: result.insertedId, ...fileDocument });
      }
    } catch (err) {
      console.error('Error in file upload:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
