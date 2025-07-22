require('dotenv').config();
const express = require('express');
const app = express();
const userRoutes = require('./routes/user');
const dogRoutes = require('./routes/dogs');
const loginRoutes = require('./routes/login');
// const port = 3000;

app.use(express.json());

app.use('/users', userRoutes);
app.use('/dogs', dogRoutes);
app.use('/login', loginRoutes);

// if (process.env.NODE_ENV !== 'test') {
//   app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`);
//   });
// }

module.exports = app;