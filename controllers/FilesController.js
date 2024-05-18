import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const FilesController = {
  postUpload: async (req, res) => {
    try {
      const {
        name,
        type,
        parentId = 0,
        isPublic = false,
        data,
      } = req.body;
      const xToken = req.headers['x-token'];
      const redisTokenId = await redisClient.get(`auth_${xToken}`);

      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisTokenId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate type
      if (!['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      // If type is not folder, data must be provided
      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Name validation
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (parentId !== 0) {
        const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
        if (!file) {
          return res.status(400).json({ error: 'Parent not found' });
        }
        if (file.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      const userId = user._id.toString();

      if (type === 'folder') {
        const newFolder = {
          userId,
          name,
          type,
          isPublic,
          parentId,
        };
        const result = await dbClient.db.collection('files').insertOne(newFolder);
        return res.status(201).json(result.ops[0]);
      }
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const localPath = path.join(folderPath, uuidv4());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

      const newFile = {
        userId,
        name,
        type,
        isPublic,
        parentId,
        localPath,
      };
      const result = await dbClient.db.collection('files').insertOne(newFile);
      return res.status(201).json(result.ops[0]);
    } catch (error) {
      return res.status(401).json({ error: 'Service Unavailable' });
    }
  },
};

export default FilesController;
