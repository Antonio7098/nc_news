const db = require("../../db/connection");

exports.convertTimestampToDate = ({ created_at, ...otherProperties }) => {
  if (!created_at) return { ...otherProperties };
  return { created_at: new Date(created_at), ...otherProperties };
};

exports.articleReferenceTable = (articles) => {
  const references = {}
  articles.forEach((article) => {
    references[article.title] = article.article_id
  })
  return references
}