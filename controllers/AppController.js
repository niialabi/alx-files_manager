import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus: async (req, res) => {
    try {
      if (redisClient.isAlive && dbClient.isAlive) {
        return res.status(200).json({ redis: true, db: true });
      }
      return res.status(500).json({ error: 'Service Unavailable' });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },

  getStats: async (req, res) => {
    try {
      const nbUsers = dbClient.nbUsers();
      const nbFiles = dbClient.nbFiles();

      if (dbClient.isAlive) {
        return res.status(200).json({ users: `${nbUsers}`, files: `${nbFiles}` });
      }
      return res.status(500).json({ error: 'Service Unavailable' });
    } catch (error) {
      return res.status(500).json({ error: 'Service Unavailable' });
    }
  },
};

export default AppController;
