import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const UsersController = {
  postNew: async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });
    try {
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const hashedPassword = sha1(password);

      const newUser = {
        email,
        password: hashedPassword,
      };

      const dbresponse = await dbClient.db.collection('users').insertOne(newUser);
      return res.status(201).json({ email: newUser.email, id: dbresponse.insertedId });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
  getMe: async (req, res) => {
    try {
      const xToken = req.headers['x-token'];
      const redisTokenId = await redisClient.get(`auth_${xToken}`);
      console.log(redisTokenId);
      console.log('here we are');
      const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(redisTokenId) });
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.json({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
};

export default UsersController;
