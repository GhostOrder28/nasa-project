const express = require('express');

const { httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch } = require('./launches.controller');

const LauncherRouter = express.Router()

LauncherRouter.get('/', httpGetAllLaunches);
LauncherRouter.post('/', httpAddNewLaunch);
LauncherRouter.delete('/:id', httpAbortLaunch);

module.exports = LauncherRouter;
