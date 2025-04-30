const db = require("../db/connection")
const format = require("pg-format")

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

function selectArticles() {
    return db.query("SELECT articles.author, articles.title, articles.article_id, articles.topic, articles.created_at, articles.votes, articles.article_img_url, COUNT(comments.comment_id)::INT AS comment_count FROM articles LEFT JOIN  comments ON articles.article_id = comments.article_id GROUP BY articles.article_id ORDER BY articles.created_at DESC")
        .then((res) => {
            const articles = res.rows
            return articles
        })
}

function selectArticleComments(articleId) {
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
    console.log(articleId, body, username)
    const addComment = db.query(`INSERT INTO comments (article_id, body, author) VALUES ($1, $2, $3) RETURNING *`, [articleId, body, username])
    return Promise.all([addComment, checkArticle])
        .then((res) => {
            const comment = res[0].rows[0]
            return comment
        })
        .catch((err) => {
            console.log(err, "<----------- IN moel")
            next(err)
        })
}

module.exports = {selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments}