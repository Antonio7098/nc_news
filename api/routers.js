const {Router} = require("express")
const usersRouter = Router()
const apiRouter = Router()
const topicsRouter = Router()
const commentRouter = Router()
const { getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment, patchArticleVotes, deleteComment, getUsers, getUser, patchCommentVotes, postArticle, postTopic, deleteArticle } = require("./controller")


apiRouter.route("/")
    .get(getEndpoints)
    
usersRouter.route("/")
    .get(getUsers)

usersRouter.route("/:username")
    .get(getUser)

topicsRouter.route("/")
    .get(getTopics)
    .post(postTopic)

commentRouter.route("/:comment_id")
    .delete(deleteComment)
    .patch(patchCommentVotes)

module.exports = { apiRouter, usersRouter, topicsRouter, commentRouter }