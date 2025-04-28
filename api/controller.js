const endpointsJson = require("../endpoints.json")
const {selectTopics, selectArticle} = require("./model")
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
            if (!article) {
                const status = 404
                const msg = "No article found with that ID"
                return next({status, msg})
            }
            return res.status(200).send({article})
        })
}

module.exports = {getEndpoints, getTopics, getArticle}