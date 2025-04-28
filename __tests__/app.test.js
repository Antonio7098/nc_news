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
  test("400: Responds with bad path error", () => {
    return request(app)
      .get("/api/not-a-path")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("Endpoint not found")
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
          console.log(topics)
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