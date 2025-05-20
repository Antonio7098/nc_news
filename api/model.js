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
                return Promise.reject({ status: 404, msg: "Not found: Article not found" });
            }
            const article = res.rows[0]
            return article
        })
}

function selectArticles(sortBy = 'created_at', order = 'DESC', topic, limit = 10, page = 1, search) {
    const validColumns = ['article_id', 'title', 'topic', 'author', 'created_at', 'votes', 'article_img_url', 'comment_count']
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

        let countStr = `SELECT COUNT(*) FROM articles`
        const countValues = []
        
        // Build WHERE clause for both queries
        const whereConditions = []
        
        // Add topic condition if provided
        if (topic) {
            whereConditions.push(`articles.topic = $${queryValues.length + 1}`)
            queryValues.push(topic)
            countValues.push(topic)
        }
        
        // Add search condition if provided
        if (search) {
            whereConditions.push(`(
                articles.title ILIKE $${queryValues.length + 1} OR
                articles.body ILIKE $${queryValues.length + 1} OR
                articles.topic ILIKE $${queryValues.length + 1} OR
                articles.author ILIKE $${queryValues.length + 1}
            )`)
            const searchPattern = `%${search}%`
            queryValues.push(searchPattern)
            countValues.push(searchPattern)
        }
        
        // Add WHERE clause to both queries if conditions exist
        if (whereConditions.length > 0) {
            const whereClause = ` WHERE ${whereConditions.join(" AND ")}`
            queryStr += whereClause
            countStr += whereClause
        }

        // Add pagination, grouping, and ordering
        queryStr += `
            GROUP BY articles.article_id
            ORDER BY articles.${sortBy} ${order}
            LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`
        
        const offset = (page - 1) * limit
        queryValues.push(limit, offset)

        const pageQuery = db.query(queryStr, queryValues)
        const countQuery = db.query(countStr, countValues)

        return Promise.all([pageQuery, countQuery])
    })
    .then((res) => {
        const articles = res[0].rows
        const totalCount = Number(res[1].rows[0].count)
        return {articles, totalCount}
    })
}

function selectArticleComments(articleId, limit, page) {
    const offset = limit * (page - 1)
    const selectComments = db.query("SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3", [articleId, limit, offset])
    const checkArticle = selectArticle(articleId)

    return Promise.all([selectComments, checkArticle])
        .then((result) => {
            const comments = result[0].rows
            const sortedComments = comments.sort((a, b) => b.created_at - a.created_at)
            return sortedComments
        })
}
function insertIntoComments(articleId, username, body) {
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

function deleteCommentModel(commentId) {
    return db.query(`SELECT * FROM comments WHERE comment_id = $1`, [commentId])
        .then((res) => {
            if (res.rows.length === 0) {
                console.log("catch in model!")
                const status = 404
                const msg = "Not found: Comment not found"
                return Promise.reject({status, msg})
            }
            return db.query(`DELETE FROM comments WHERE comment_id = $1`, [commentId])
        })
}

function selectUsers() {
    return db.query(`SELECT * FROM users`)
        .then((res) => {
            const users = res.rows
            return users
        })
}

function selectUser(username) {
    return db.query(`SELECT * FROM users WHERE username = $1`, [username])
        .then((res) => {
            let user = res.rows[0]
            if (!user) {
                return Promise.reject({
                    status: 404,
                    msg: "Not found: User not found"
                })
            }
            return user
        })
}

function incrementCommentVotes(id, increment) {
    return db.query(`UPDATE comments SET votes = votes + $1 WHERE comment_id = $2 RETURNING *`, [increment, id])
        .then((res) => {
            const comment = res.rows[0]
            if (!comment) {
                return Promise.reject({status: 404, msg: "Not found: No comment found with that ID"})
            }
            return comment
        })
}

function insertArticle(username, title, body, topic, article_img_url) {
    return db.query(`INSERT INTO articles (title, topic, author, body, article_img_url) VALUES ($1,$2, $3, $4, $5) RETURNING *`, [title, topic, username, body, article_img_url])
        .then((res) => {
            const article = res.rows[0]
            return db.query(`SELECT COUNT (article_id) FROM comments WHERE article_id = $1`, [article.article_id])
                .then((res) => {
                    const comment_count = res.rows[0].comment_count
                    article.comment_count = comment_count
                    return article
                })
        })
}

function insertTopic(slug, description) {
    return db.query(`INSERT INTO topics (slug, description) VALUES ($1, $2) RETURNING *`, [slug, description])
        .then((res) => {
            const topic = res.rows[0]
            return topic
        })
        .catch((err) => {
            console.log(err)
        })
}

function deleteArticleModel(id) {
    return db.query(`SELECT * FROM articles WHERE article_id = $1`, [id])
        .then((res) => {
            if (res.rows.length === 0) {
                return Promise.reject({
                    status: 404, 
                    msg: "Not found: Article not found" 
                })
            }
            db.query(`DELETE FROM articles WHERE article_id = $1`, [id])
        })
}

module.exports = { selectTopics, selectArticle, selectArticles, selectArticleComments, insertIntoComments, updateArticleVotes, deleteCommentModel, selectUsers, selectUser, incrementCommentVotes, insertArticle, insertTopic, deleteArticleModel }