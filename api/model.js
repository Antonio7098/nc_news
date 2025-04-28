const db = require("../db/connection")

function selectTopics() {
    return db.query("SELECT * FROM topics").then((response) => {
        const topics = response.rows
        return topics
    })
}

module.exports = {selectTopics}