const endpointsJson = require("../endpoints.json")
const {selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments} = require("./model")
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
    console.log(username, body)
    if (!username || !body){
        const status = 400
        const msg = "Bad request: Missing required fields"
        return next({status, msg})
    }
    return insertIntoComments(articleId, username, body, next)
        .then((comment) => {
            return res.status(201).send({comment})
        })
        .catch(next)
}

module.exports = {getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment}