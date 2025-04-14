const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require("./config/db")

const urlRoutes = require('./routes/url');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/', urlRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    db();
    console.log(`Server running on port ${PORT}`);
});