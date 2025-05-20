const endpointsJson = require("../endpoints.json")
const { selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments, updateArticleVotes, deleteCommentModel, selectUsers, selectUser, incrementCommentVotes, insertArticle, insertTopic, deleteArticleModel } = require("./model")
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

function getArticles(req, res, next) {
    let { sort_by: sortBy, order, topic, limit, page, search } = req.query

    sortBy = sortBy || 'created_at'
    order = order ? order.toUpperCase() : 'DESC'

    if((limit && isNaN(limit)) || (page && isNaN(page))) {
        next({
            invalidInputFormat: true
        })
    }

    limit = limit || 10
    page = page || 1

    return selectArticles(sortBy, order, topic, limit, page, search)
        .then((result) => {
            const {articles, totalCount: total_count} = result

            return res.status(200).send({articles, total_count})
        })
        .catch((err) => {console.log(err, sortBy, order, topic, limit, page ); return next(err)})
} 

function getArticleComments(req, res, next) {
    const articleId = req.params.article_id
    let {limit, page} = req.query

    if((limit && isNaN(limit)) || (page && isNaN(page))) {
        next({
            invalidInputFormat: true
        })
    }

    limit = limit || 10
    page = page || 1

    return selectArticleComments(articleId, limit, page)
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
    console.log(commentID, "<----------------- In controller")
    if (isNaN(commentID)) {
        const status = 400
        msg = "Bad request: Invalid comment ID"
        return next({status, msg})
    }
    return deleteCommentModel(commentID, next)
        .then(() => res.status(204).send())
        .catch((err) => {
            console.log(err)
            return next(err)
        })
}

function getUsers(req, res) {
    return selectUsers()
        .then((users) => {
            res.status(200).send({users})
        })
}

function getUser(req, res, next) {
    const {username} = req.params

    return selectUser(username)
        .then((user) => {
            res.status(200).send({user})
        })
        .catch(next)
}

function patchCommentVotes(req, res, next) {
    const id = req.params.comment_id
    const increment = req.body.inc_votes
    
    if(!increment) {
        next({
            missingField: true
        })
    }

    if(isNaN(increment)) {
        next({
            invalidInputFormat: true
        })
    }

    return incrementCommentVotes(id, increment)
        .then((comment) => {
            return res.status(200).send({comment})
        })
        .catch(next)
}

function postArticle(req, res, next) {
    let { author: username, title, body, topic, article_img_url } = req.body

    if (!username || !title || !body || !topic) {
        next({
            missingField: true
        })
    }

    article_img_url = article_img_url || "default_url"

    if (typeof username !== 'string' || typeof title !== 'string' || typeof body !== 'string' || typeof topic !== 'string' || typeof article_img_url !== 'string') {
        next({
            invalidInputFormat: true
        })
    }
    

    return insertArticle(username, title, body, topic, article_img_url)
        .then((article) => {
            res.status(201).send({ article })
        })
        .catch(next)
}

function postTopic(req, res, next) {
    const {slug, description} = req.body

    if (!slug || !description) {
        next({
            missingField: true
        })
    }

    if((slug && typeof slug !== 'string') || (description && typeof description !== 'string')) {
        next({
            invalidInputFormat: true
        })
    }

    return insertTopic(slug, description)
        .then((topic) => {
            res.status(201).send({topic})
        })
}

function deleteArticle(req, res, next) {
    const id = req.params.article_id

    return deleteArticleModel(id)
        .then(() => res.status(204).send({}))
        .catch(next)
}

module.exports = { getEndpoints, getTopics, getArticle, getArticles, getArticleComments, addComment, patchArticleVotes, deleteComment, getUsers, getUser, patchCommentVotes, postArticle, postTopic, deleteArticle }