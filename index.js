const serverlessExpress = require('@vendia/serverless-express');
const server = require('./server');

exports.handler = serverlessExpress({ server });