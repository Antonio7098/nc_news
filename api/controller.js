const endpointsJson = require("../endpoints.json")
const { selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments, updateArticleVotes, deleteCommentModel, selectUsers } = require("./model")
// #1 Get documentation detailing all of the available API endpoints 
function getEndpoints(req, res) {
    res.status(200).send({endpoints: endpointsJson})
}

function getTopics(req, res) {
    return selectTopics()
        .then((topics) => {
            return res.status(200).send({topics})
        })
}

function getArticle(req, res, next) {
    const articleId = req.params.article_id
    return selectArticle(articleId)
        .then((article) => {
            return res.status(200).send({article})
        })
        .catch(next)
}

function getArticles(req,res, next) {
    return selectArticles()
        .then((articles) => {
            return res.status(200).send({articles})
        })
} 

function getArticleComments(req, res, next) {
    const articleId = req.params.article_id
    return selectArticleComments(articleId)
        .then((comments) => {
            return res.status(200).send({comments})
        })
        .catch(next)
}

function addComment(req, res, next) {
    const articleId = req.params.article_id
    const {username, body} = req.body
    if (!username || !body){
        return next({missingField: true})
    }
    return insertIntoComments(articleId, username, body, next)
        .then((comment) => {
            return res.status(201).send({comment})
        })
        .catch(next)
}

function patchArticleVotes(req, res, next) {
    const articleId = req.params.article_id
    const increment = req.body.inc_votes
    if (!increment) {
        return next({missingField: true})
    }
    else if (isNaN(increment)) {
        return next({invalidInputFormat: true})
    }
    return updateArticleVotes(articleId, increment, next)
        .then((article) => {
            res.status(200).send({article})
        })
}

function deleteComment(req, res, next) {
    const commentID = req.params.comment_id
    if (isNaN(commentID)) {
        const status = 400
        msg = "Bad request: Invalid comment ID"
        return next({status, msg})
    }
    return deleteCommentModel(commentID, next)
        .then(() => res.status(204).send())
        .catch(next)
}

function getUsers(req, res, next) {
    return selectUsers(next)
        .then((users) => {
            res.status(200).send({users})
        })
}

module.exports = { getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment, patchArticleVotes, deleteComment, getUsers }