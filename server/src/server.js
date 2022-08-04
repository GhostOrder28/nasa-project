require('dotenv').config();
const http = require('http');

const app = require('./app');
const { loadHabitablePlanets } = require('./models/planets.model');
const { loadLaunchData } = require('./models/launches.model');
const { mongoConnect } = require('./services/mongo');

const server = http.createServer(app);

const PORT = process.env.PORT || 8000;
async function startServer () {
  await mongoConnect();
  await loadHabitablePlanets();
  await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

startServer();
