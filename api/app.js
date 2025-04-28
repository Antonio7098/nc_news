const express = require('express')
const { getEndpoints, getTopics } = require("./controller")

// Setting up the app and specifying that we want to parse get requests
const app = express()
app.use(express.json())

// #1 Get documentation detailing all of the available API endpoints
app.get("/api", getEndpoints)

// Get a list of topics
app.get("/api/topics", getTopics)

// Catch all invalid endpoints
app.all('/*splat', (req, res, next) => {
  next({ status: 400, msg: 'Endpoint not found' })
})

// Error handler
app.use((err, req, res, next) => {
  const status = err.status
  const msg = err.msg
  res.status(status).send({ msg })
})

module.exports = app

