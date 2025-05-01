const db = require("../db/connection")
const format = require("pg-format")
const { sort } = require("../db/data/test-data/articles")

function selectTopics() {
    return db.query("SELECT * FROM topics").then((response) => {
        const topics = response.rows
        return topics
    })
}

function selectArticle(articleId) {
    return db.query("SELECT * FROM articles WHERE article_id = $1", [articleId])
        .then((res) => {
            if (res.rows.length === 0) {
                return Promise.reject({ status: 404, msg: "No article found with that ID" });
            }
            const article = res.rows[0]
            return article
        })
}

function selectArticles(sortBy, order, topic) {
    const validColumns = ['article_id', 'title', 'topic', 'author', 'created_at', 'votes', 'article_img_url']
    const validOrders = ['ASC', 'DESC']

    if (!validColumns.includes(sortBy)) {
        return Promise.reject({status: 400, msg: "Bad request: Invalid column name"})
    }
    if (!validOrders.includes(order)) {
        return Promise.reject({ status: 400, msg: "Bad request: Invalid order" });
    }

    let topicValidationPromise = Promise.resolve()

    if (topic) {
        topicValidationPromise = db.query("SELECT slug FROM topics WHERE slug = $1", [topic])
            .then(({ rows }) => {
                if (rows.length === 0) {
                    return Promise.reject({ status: 400, msg: "Bad request: Invalid topic" })
                }
            })
    }

    return topicValidationPromise.then(() => {
        const queryValues = []
        let queryStr = `
            SELECT
                articles.author,
                articles.title,
                articles.article_id,
                articles.topic,
                articles.created_at,
                articles.votes,
                articles.article_img_url,
                COUNT(comments.comment_id)::INT AS comment_count
            FROM articles
            LEFT JOIN comments ON articles.article_id = comments.article_id
        `

        if (topic) {
            queryStr += ` WHERE articles.topic = $1`
            queryValues.push(topic)
        }

        queryStr += `
            GROUP BY articles.article_id
            ORDER BY articles.${sortBy} ${order.toUpperCase()};`

        return db.query(queryStr, queryValues)
    })
    .then((res) => {
        const articles = res.rows
        return articles
    })
}

function selectArticleComments(articleId, sortBy, order) {
    const selectComments = db.query("SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at ASC", [articleId])
    const checkArticle = selectArticle(articleId)

    return Promise.all([selectComments, checkArticle])
        .then((result) => {
            const comments = result[0].rows
            const sortedComments = comments.sort((a, b) => b.created_at - a.created_at)
            return sortedComments
        })
}
function insertIntoComments(articleId, username, body, next) {
    const checkArticle = selectArticle(articleId)
    const addComment = db.query(`INSERT INTO comments (article_id, body, author) VALUES ($1, $2, $3) RETURNING *`, [articleId, body, username])
    return Promise.all([addComment, checkArticle])
        .then((res) => {
            const comment = res[0].rows[0]
            return comment
        })
}

function updateArticleVotes(articleId, increment, next) {
    const checkArticle = selectArticle(articleId)
    const updateVotes = db.query(`UPDATE articles SET votes = votes + $2 WHERE article_id = $1 RETURNING *`, [articleId, increment])
    return Promise.all([updateVotes, checkArticle])
        .then((res) => {
            const article = res[0].rows[0]
            return article
        })
        .catch(next)
}

function deleteCommentModel(commentId, next) {
    return checkComment = db.query(`SELECT * FROM comments WHERE comment_id = $1`, [commentId])
        .then((res) => {
            if (res.rows.length === 0) {
                const status = 404
                const msg = "No comment found with that ID"
                return Promise.reject({status, msg})
            }
            return db.query(`DELETE FROM comments WHERE comment_id = $1`, [commentId])
        })
        .catch(next)
}

function selectUsers(next) {
    return db.query(`SELECT * FROM users`)
        .then((res) => {
            const users = res.rows
            return users
        })
}

module.exports = { selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments, updateArticleVotes, deleteCommentModel, selectUsers }