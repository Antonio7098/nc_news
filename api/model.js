const db = require("../db/connection")

function selectTopics() {
    return db.query("SELECT * FROM topics").then((response) => {
        const topics = response.rows
        return topics
    })
}

function selectArticle(articleId) {
    return db.query("SELECT * FROM articles WHERE article_id = $1", [articleId])
        .then((res) => {
            const article = res.rows[0]
            return article
        })
}

module.exports = {selectTopics, selectArticle}