const launchesDataBase = require('./launches.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

async function getLatestFlightNumber () {
  const latestLaunch = await launchesDataBase.findOne().sort('-flightNumber');
  if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;

  return latestLaunch.flightNumber;
}

async function existsLaunchWithId(launchId) {
  return await launchesDataBase.findOne({
    flightNumber: launchId,
  })
}

async function getAllLaunches () {
  return await launchesDataBase.find({}, { '__v': 0, '_id': 0 })
}

async function scheduleNewLaunch (launch) {
  const newFlightNumber = await getLatestFlightNumber() + 1;

  const newLaunch = Object.assign(launch, {
    flightNumber: newFlightNumber, 
    customer: ['ZTM', 'NASA'],
    upcoming: true,
    success: true,
  });

  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  return await launchesDataBase.updateOne({
    flightNumber: launchId,
  }, {
    upcoming: false,
    success: false,
  })
}

async function saveLaunch (launch) {
  const planet = await planets.findOne({
    keplerName: launch.target
  });
  if (!planet) throw new Error("No matching planet was find");

  await launchesDataBase.findOneAndUpdate({
    flightNumber: launch.flightNumber
  }, launch, {
    upsert: true
  })
}


module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
}
