const express = require('express')
const { apiRouter, usersRouter, topicsRouter, commentRouter, articleRouter } = require("./routers")
const { getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment, patchArticleVotes, deleteComment, getUsers, getUser, patchCommentVotes, postArticle, postTopic, deleteArticle } = require("./controller")

const cors = require('cors');

// Setting up the app and specifying that we want to parse get requests
const app = express()
app.use(cors());
app.use(express.json())

// ------------------------------------------------- Paths --------------------------------------------------

app.use("/api", apiRouter)



// #1 Get documentation detailing all of the available API endpoints
app.get("/api", getEndpoints)



// Get article by id
app.get("/api/articles/:article_id", getArticle)

// Get articles
app.get("/api/articles", getArticles)

// Get comments by article
app.get("/api/articles/:article_id/comments", getArticleComments)

// Add comment
app.post("/api/articles/:article_id/comments", addComment)

// Update article votes
app.patch("/api/articles/:article_id", patchArticleVotes)

// Add article
app.post("/api/articles", postArticle)

// Deelete article
app.delete("/api/articles/:article_id", deleteArticle)




// Topics
apiRouter.use("/topics", topicsRouter)

// Comments
apiRouter.use("/comments", commentRouter)


apiRouter.use("/users", usersRouter);  // Mount the usersRouter on the /users path






// Users



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
    // User not found
    if (/author/.test(err.constraint)) {
      res.status(404).send({
        status: 404,
        msg: "Not found: User not found"
      })
    }
    // Topic nto found
    else if (/topic/.test(err.constraint)) {
      res.status(404).send({
        status: 404,
        msg: "Not found: Topic not found"
      })
    }
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

