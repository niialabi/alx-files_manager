import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus: async (req, res) => {
    try {
      const redisClientVar = await redisClient();
      const dbClientVar = await dbClient();

      if (redisClientVar.isAlive && dbClientVar.isAlive) {
        return res.status(200).json({ redis: true, db: true });
      }
      return res.status(500).json({ error: 'Service Unavailable' });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },

  getStats: async (req, res) => {
    try {
      const dbClientVar = await dbClient();
      const nbUsers = await dbClientVar.nbUsers();
      const nbFiles = await dbClientVar.nbFiles();

      if (dbClientVar.isAlive) {
        return res.status(200).json({ users: `${nbUsers}`, files: `${nbFiles}` });
      }
      return res.status(500).json({ error: 'Service Unavailable' });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
};

export default AppController;
