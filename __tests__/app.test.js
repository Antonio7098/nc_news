const endpointsJson = require("../endpoints.json");
const app  = require("../api/app")
const request = require("supertest")
const testData = require("../db/data/test-data")
const seed = require("../db/seeds/seed")
const db = require("../db/connection")

// seeding (or re-seeding)the database before each test and then endign the connection after

beforeEach(() => {
  return seed(testData)
})

afterAll(() => {
  return db.end()
})

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body: { endpoints } }) => {
        expect(endpoints).toEqual(endpointsJson)
      })
  })
})

describe('Bad path error', () => {
  test("404: Responds with bad path error", () => {
    return request(app)
      .get("/api/not-a-path")
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("Not found")
      })
  })
});

describe("GET /api/topics", () => {
  describe('Behaviour', () => {
    test("200: Responds with an object containing all topics", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          expect(Array.isArray(topics)).toBe(true)
          expect(topics.length).toBeGreaterThan(0)
          topics.forEach((topic) => {
            expect(topic).toEqual(expect.objectContaining({
              slug: expect.any(String),
              description: expect.any(String)
            }))
          })
        })
    })
  });
})

describe("GET /api/articles/:article_id", () => {
  describe('Behaviour', () => {
    test("200: Responds with an the correct article", () => {
      return request(app)
        .get("/api/articles/1")
        .expect(200)
        .then(({ body: { article } }) => {
          expect(article).toEqual(expect.objectContaining({
            "article_id": 1,
            "title": expect.any(String),
            "topic": expect.any(String),
            "author": "butter_bridge",
            "body": expect.any(String),
            "created_at": expect.any(String),
            "votes": expect.any(Number),
            "article_img_url": expect.any(String)
          }))
        })
      })
    })

  describe('Error handling', () => {
    test('404: No article with that id', () => {
      return request(app)
        .get("/api/articles/1000000")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("No article found with that ID")
        })
      })

      test('400: Bad article ID', () => {
        return request(app)
          .get("/api/articles/cow")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request")
          })
      })
  });
})

describe('"GET /api/articles"', () => {
  describe('Behaviour', () => {
    test('200: Returns array of all articles', () => {
      return request(app)
      .get("/api/articles")
      .expect(200)
      .then(({ body: { articles } }) => {
        expect(Array.isArray(articles)).toBe(true)
        expect(articles.length).toBeGreaterThan(0)
        articles.forEach((article) => {
          expect(article).toEqual(expect.objectContaining({
            author: expect.any(String),
            title: expect.any(String),
            article_id: expect.any(Number),
            topic: expect.any(String),
            created_at: expect.any(String), 
            votes: expect.any(Number),
            article_img_url: expect.any(String),
            comment_count: expect.any(Number)
          }))
        })
      })
    });
  });
});

describe('"GET /api/articles/:article_id/comments"', () => {
  describe('Behaviour', () => {
    test('200: Returns array of all comments for that article', () => {
      return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then(({ body: { comments } }) => {
        expect(Array.isArray(comments)).toBe(true)
        comments.forEach((comment) => {
          expect(comment).toEqual(expect.objectContaining({
            comment_id: expect.any(Number),
            votes: expect.any(Number),
            created_at: expect.any(String),
            author: expect.any(String),
            body: expect.any(String),
            article_id: 1
          }))
        })
        expect(comments).toBeSortedBy("created_at", {descending: true})
      })
    });
  });

  describe('Error handling', () => {
    test('404: No article with that id', () => {
      return request(app)
        .get("/api/articles/1000000/comments")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("No article found with that ID")
        })
    })

    test('400: Bad article ID', () => {
      return request(app)
        .get("/api/articles/cow/comments")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request")
        })
    })
  });
});