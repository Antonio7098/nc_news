const express = require('express')
const { getEndpoints, getTopics, getArticle, getArticles } = require("./controller")

// Setting up the app and specifying that we want to parse get requests
const app = express()
app.use(express.json())

// #1 Get documentation detailing all of the available API endpoints
app.get("/api", getEndpoints)

// Get a list of topics
app.get("/api/topics", getTopics)

// Get article by id
app.get("/api/articles/:article_id", getArticle)

// Get articles
app.get("/api/articles", getArticles)

// Catch all invalid endpoints
app.all('/*splat', (req, res, next) => {
  next({ status: 404, msg: 'Not found' })
})

// PSQL Error handler
app.use((err, req, res, next) => {
  if (err.code === "22P02") {
    const status = 400
    const msg = "Bad request"
    res.status(status).send({status, msg})
  }
  else {
    next(err)
  }
})

// Error handler
app.use((err, req, res, next) => {
  const status = err.status
  const msg = err.msg
  res.status(status).send({ msg })
})

module.exports = app

