import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AuthController = {
  getConnect: async (req, res) => {
    try {
      const base64Credentials = (req.headers.authorization).split(' ')[1];
      const decCred = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [email, password] = decCred.split(':');
      const user = await dbClient.db.collection('users').findOne({ email, password: sha1(password) });
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      const token = uuidv4();
      await redisClient.set(`auth_${token}`, (user._id).toString(), 24 * 60 * 60);
      return res.status(200).json({ token });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
  getDisconnect: async (req, res) => {
    try {
      const xToken = req.headers['x-token'];
      const userId = await redisClient.get(`auth_${xToken}`);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(`auth_${xToken}`);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
};

export default AuthController;
