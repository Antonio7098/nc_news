const endpointsJson = require("../endpoints.json")
const {selectTopics, selectArticle, selectArticles} = require("./model")
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

module.exports = {getEndpoints, getTopics, getArticle, getArticles}