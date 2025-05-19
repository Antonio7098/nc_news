const db = require("../connection")
const format = require("pg-format")
const { convertTimestampToDate, articleReferenceTable } = require("./utils")

const seed = ({ topicData, userData, articleData, commentData }) => {
  return db.query(`BEGIN;`)
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS comments;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS articles;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS users;`)
    })
    .then(() => {
      return db.query(`DROP TABLE IF EXISTS topics;`)
    })
    .then(() => db.query(`
      CREATE TABLE topics (
        slug VARCHAR(100), PRIMARY KEY (slug),
        description VARCHAR(1000),
        img_url VARCHAR(1000)
      );`
    ))
    .then(() => db.query(`
      CREATE TABLE users (
        username VARCHAR(100), PRIMARY KEY (username),
        name VARCHAR(100),
        avatar_url VARCHAR(1000)
      );`
    ))
    .then(() => db.query(`
      CREATE TABLE articles (
        article_id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        topic VARCHAR REFERENCES topics(slug),
        author VARCHAR(100) REFERENCES users(username),
        body TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        votes INT DEFAULT 0,
        article_img_url VARCHAR(1000)
      );`
    ))
    .then(() => db.query(`
      CREATE TABLE comments(
        comment_id SERIAL PRIMARY KEY,
        article_id INT REFERENCES articles(article_id) ON DELETE CASCADE,
        body TEXT,
        votes INT DEFAULT 0,
        author VARCHAR(100) REFERENCES users(username),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    ))
    .then(() => {
      const topicsData = topicData.map((topic) => 
        [
        topic.slug,
        topic.description,
        topic.img_url
        ]
      )
      const query = format('INSERT INTO topics (slug, description, img_url) VALUES %L', topicsData)
      return db.query(query)
    })
    .then(() => {
      const usersData = userData.map((user) => 
        [
        user.username,
        user.name,
        user.avatar_url
        ]
      )
      const query = format('INSERT INTO users (username, name, avatar_url) VALUES %L', usersData)
      return db.query(query)
    })
    .then(() => {
      const articlesData = articleData.map((article) => 
        [
        article.title,
        article.topic,
        article.author,
        article.body,
        convertTimestampToDate({created_at: article.created_at}).created_at,
        article.votes,
        article.article_img_url
        ]
      )
      const query = format('INSERT INTO articles (title, topic, author, body, created_at, votes, article_img_url) VALUES %L RETURNING *', articlesData)
      return db.query(query)
    })
    .then((articles) => {
      const articleRef = articleReferenceTable(articles.rows)
      const commentsData = commentData.map((comment) => 
        [
          articleRef[comment.article_title],
          comment.body,
          comment.votes,
          comment.author,
          convertTimestampToDate({created_at: comment.created_at}).created_at,
        ]
      )
      const query = format(`INSERT INTO comments (article_id, body, votes, author, created_at) VALUES %L`, commentsData)
      return db.query(query)
    })
    .then(() => {
      return db.query('COMMIT;')
    })
    .catch((err) => {
      console.error('Error during seeding:', err)
      return db.query('ROLLBACK;')
    })
}
  
module.exports = seed
