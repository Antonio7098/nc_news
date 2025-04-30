const express = require('express')
const { getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment, patchArticleVotes, deleteComment } = require("./controller")

// Setting up the app and specifying that we want to parse get requests
const app = express()
app.use(express.json())

// ------------------------------------------------- Paths --------------------------------------------------

// #1 Get documentation detailing all of the available API endpoints
app.get("/api", getEndpoints)

// Get a list of topics
app.get("/api/topics", getTopics)

// Get article by id
app.get("/api/articles/:article_id", getArticle)

// Get articles
app.get("/api/articles", getArticles)

// Get comments by article
app.get("/api/articles/:article_id/comments", getArticleComments)

// Add comment
app.post("/api/articles/:article_id/comments", addComment)

// Increment votes
app.patch("/api/articles/:article_id", patchArticleVotes)

// Delete comment
app.delete("/api/comments/:comment_id", deleteComment)

// ------------------------------------------- Errors --------------------------------------------------

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
  else if (err.code === "23503") {
    const status = 404
    const msg = "Username not found"
    res.status(status).send({status, msg})
  }
  else {
    next(err)
  }
})

// Custom errors
app.use((err, req, res, next) => {
  if (err.missingField) {
    const status = 400
    const msg = "Bad request: Missing required fields"
    res.status(status).send({status, msg})
  }
  else if (err.invalidInputFormat) {
    const status = 400
    const msg = "Bad request: Invalid input format"
    res.status(status).send({status, msg})
  }
  else {
    next(err)
  }
})

// General handler
app.use((err, req, res, next) => {
  const status = err.status
  const msg = err.msg
  res.status(status).send({ msg })
})

module.exports = app

