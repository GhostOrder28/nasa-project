const axios = require('axios');

const launchesDataBase = require('./launches.mongo');
const planets = require('./planets.mongo');
const { getPagination } = require('../services/query');

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query'
const DEFAULT_FLIGHT_NUMBER = 100;

async function populateLaunches () {
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1
          }
        },
        {
          path: 'payloads',
          select: {
            customers: 1
          }
        }
      ]
    }
  })

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads'];
    const customers = payloads.flatMap(payload => payload['customers']);

    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers 
    }

    console.log(`${launch.flightNumber} ${launch.mission}`);
    await saveLaunch(launch);
  }
}

async function loadLaunchData () {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat'
  });

  if (firstLaunch) {
    console.log('launch data was already loaded!');
  } else {
    await populateLaunches();
  }
}

async function getLatestFlightNumber () {
  const latestLaunch = await launchesDataBase.findOne().sort('-flightNumber');
  if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;

  return latestLaunch.flightNumber;
}

async function findLaunch(filter) {
  return await launchesDataBase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  })
}

async function getAllLaunches (query) {
  const { limit, skip } = getPagination(query);
  return await launchesDataBase.find({}, { '__v': 0, '_id': 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit)
}

async function scheduleNewLaunch (launch) {
  const planet = await planets.findOne({
    keplerName: launch.target
  });
  if (!planet) throw new Error("No matching planet was find");

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
  await launchesDataBase.findOneAndUpdate({
    flightNumber: launch.flightNumber
  }, launch, {
    upsert: true
  })
}


module.exports = {
  loadLaunchData,
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
}
