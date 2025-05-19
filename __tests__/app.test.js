const app = require("../api/app");
const request = require("supertest");
const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const testData = require("../db/data/test-data");

beforeEach(() => {
  return seed(testData); // very important to RETURN
});

afterAll(() => {
  return db.end(); // very important to RETURN
});

describe("GET /api", () => {
  test("200: Responds with an object detailing the documentation for each endpoint", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body.endpoints).toBeInstanceOf(Object);
      });
  });
});

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
  describe('Happy path', () => {
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
  describe('Happy path', () => {
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

  describe('Sad path', () => {
    test('404: No article with that id', () => {
      return request(app)
        .get("/api/articles/1000000")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: Article not found")
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
  describe('Happy path', () => {
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
        expect(articles).toBeSortedBy('created_at', {descending: true})
      })
    });
  });

  describe('Sort by column', () => {
    describe('Happy path', () => {
      test('200: Returns array of all articles in correct order', () => {
        const columns = ['article_id', 'title', 'topic', 'author', 'created_at', 'votes', 'article_img_url']
        const queries = []
        const orders = ['asc', 'desc'];
        orders.forEach((order) => {
          columns.forEach((column) => {
            queries.push({sort_by: column, order: order})
          })
        })

        const requests = queries.map(({sort_by, order}) =>
          request(app)
          .get("/api/articles")
          .query({sort_by: sort_by, order: order})
          .expect(200)
        )

        return Promise.all(requests)
          .then((results) => {
              results.forEach (({ body: { articles } }, index) => {
                expect(Array.isArray(articles)).toBe(true)
                expect(articles.length).toBeGreaterThan(0)
                const { sort_by, order } = queries[index]
                
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
              expect(articles).toBeSortedBy(sort_by, {descending: order === 'desc'})
            })
          })
      });

      describe('Filter by topic', () => {
        describe('Happy path', () => {
          test('200: articles filtered by topic', () => {
            const topics = ['mitch', 'cats', 'paper']
            const queries = topics.map((topic) => 
              request(app)
              .get("/api/articles")
              .query({topic})
              .expect(200)
            )

            return Promise.all(queries)
              .then((results) => {
                  results.forEach (({ body: { articles } }, index) => {
                    expect(Array.isArray(articles)).toBe(true)
                    const topic = topics[index]
                    
                    articles.forEach((article) => {
                      expect(article).toEqual(expect.objectContaining({
                        author: expect.any(String),
                        title: expect.any(String),
                        article_id: expect.any(Number),
                        topic: topic,
                        created_at: expect.any(String), 
                        votes: expect.any(Number),
                        article_img_url: expect.any(String),
                        comment_count: expect.any(Number)
                      }))
                    })
                })
              })
            });
        });

        // describe('Edge cases', () => {
        //   test('200: no topics of that type', () => {
        //     const slug = 'test_topic';
        //     const description = 'Description for a test topic';
        //     const img_url = ""

        //     return db.query('INSERT INTO topics (slug, description, img_url) VALUES ($1, $2, $3);', [slug, description, img_url])
        //       .then(() => {
        //         return request(app)
        //           .get("/api/articles")
        //           .query({topic: slug})
        //           .expect(200)
        //           .then(({body: {articles}}) => expect(articles).toEqual([]))
        //       })
        //   });
        // });

        describe('Error handling', () => {
          test('400: bad topic', () => {
            const topic = "war"
            return request(app)
              .get("/api/articles")
              .query({topic: "topic"})
              .expect(400)
              .then(({body: {msg}}) => {
                expect(msg).toBe("Bad request: Invalid topic")
              })
          });
        });
      });
    });
  });

  describe('Limit and page', () => {
    describe('Happy path', () => {
      test("200: responds with 10 articles by default", () => {
        return request(app)
          .get("/api/articles")
          .expect(200)
          .then(({ body }) => {
            expect(body.articles).toHaveLength(10)
            expect(body.total_count).toBeGreaterThan(10)
          });
      });
    
      test("200: accepts a limit query which limits the number of responses", () => {
        return request(app)
          .get("/api/articles")
          .query({limit: 5})
          .expect(200)
          .then(({ body }) => {
            expect(body.articles).toHaveLength(5)
            expect(body.total_count).toBeGreaterThan(5)
          })
      })
    
      test("200: accepts a page query which offsets the responses", () => {
        return request(app)
          .get("/api/articles")
          .query({ limit: 5, page: 1 })
          .expect(200)
          .then(({ body }) => {
            const first5 = body.articles;
            expect(first5).toHaveLength(5);

            return request(app)
              .get("/api/articles")
              .query({ limit: 5, page: 2 })
              .expect(200)
              .then(({ body }) => {
                const second5 = body.articles
                expect(second5).toHaveLength(5)

                const firstIds = first5.map((article) => article.article_id)
                const secondIds = second5.map((article) => article.article_id)
                secondIds.forEach((id) => {
                  expect(firstIds).not.toContain(id)
                });
              });
          });
      });

      test("200: pagination works alongside filters", () => {
        return request(app)
          .get("/api/articles")
          .query({topic: "mitch", limit: 10})
          .expect(200)
          .then(({ body }) => {
            expect(body.articles.length).toBe(10)
            body.articles.forEach(article => {
              expect(article.topic).toBe("mitch")
            })
            expect(body.total_count).toBe(12)
          })
      })
    
      describe('Sad path', () => {
        test("400: responds with error for non-numeric limit", () => {
          return request(app)
          .get("/api/articles")
            .query({limit: "non_numeric_limit"})
            .expect(400)
            .then(({ body }) => {
              expect(body.msg).toBe("Bad request: Invalid input format");
            })
        })
        
        test("400: responds with error for non-numeric page", () => {
          return request(app)
          .get("/api/articles")
          .query({page: "non_numeric_page"})
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).toBe("Bad request: Invalid input format");
          })
        })
      });
  });
});

  describe('Error handling', () => {
    test("400: Invalid column name", () => {
      return request(app)
        .get("/api/articles")
        .query({ sort_by: "not_a_column" })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad request: Invalid column name");
        })
    })

    test("400: Invalid order", () => {
      return request(app)
        .get("/api/articles")
        .query({ order: "not_an_order" })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad request: Invalid order");
        })
    })
  });
});

describe('"GET /api/articles/:article_id/comments"', () => {
  describe('Happy path', () => {
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

  describe('Sad path', () => {
    test('404: No article with that id', () => {
      return request(app)
        .get("/api/articles/1000000/comments")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: Article not found")
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
  })

  describe('Pagination', () => {
    describe('Happy path', () => {
      test("200: responds with 10 comments by default", () => {
        return request(app)
          .get("/api/articles/1/comments")
          .expect(200)
          .then(({ body }) => {
            expect(body.comments).toHaveLength(10)
          });
      });
    
      test("200: accepts a limit query which limits the number of responses", () => {
        return request(app)
          .get("/api/articles/1/comments")
          .query({limit: 5})
          .expect(200)
          .then(({ body }) => {
            expect(body.comments).toHaveLength(5)
          })
      })
    
      test("200: accepts a page query which offsets the responses", () => {
        return request(app)
          .get("/api/articles/1/comments")
          .query({ limit: 5, page: 1 })
          .expect(200)
          .then(({ body }) => {
            const first5 = body.comments;
            expect(first5).toHaveLength(5);

            return request(app)
              .get("/api/articles/1/comments")
              .query({ limit: 5, page: 2 })
              .expect(200)
              .then(({ body }) => {
                const second5 = body.comments
                expect(second5).toHaveLength(5)

                const firstIds = first5.map((comment) => comment.comment_id)
                const secondIds = second5.map((comment) => comment.comment_id)
                secondIds.forEach((id) => {
                  expect(firstIds).not.toContain(id)
                });
              });
          });
      });
    });

    describe('Sad path', () => {
      test("400: responds with error for non-numeric limit", () => {
        return request(app)
        .get("/api/articles/1/comments")
          .query({limit: "non_numeric_limit"})
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).toBe("Bad request: Invalid input format");
          })
      })
      
      test("400: responds with error for non-numeric page", () => {
        return request(app)
        .get("/api/articles/1/comments")
        .query({page: "non_numeric_page"})
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad request: Invalid input format");
        })
      })
    });
  });
})

describe('"POST /api/articles/:article_id/comments"', () => {
  describe('Happy path', () => {
    test('200: Returns the comment', () => {
      return request(app)
      .post("/api/articles/1/comments")
      .send({
        body: "The beautiful thing about dog is that it exists. Got to find out what kind of dog these are; not cotton, not rayon, silky.",
        username: "butter_bridge"
      })
      .expect(201)
      .then(({ body: { comment } }) => {
        expect(comment).toEqual(expect.objectContaining({
          article_id: 1,
          body: "The beautiful thing about dog is that it exists. Got to find out what kind of dog these are; not cotton, not rayon, silky.",
          votes: 0,
          author: "butter_bridge",
          created_at: expect.any(String)
        }))
      })
    })
  })

    describe('Sad path', () => {
      test('404: No article with that id', () => {
        return request(app)
        .post("/api/articles/1000/comments")
        .send({
          body: "The beautiful thing about dog is that it exists. Got to find out what kind of dog these are; not cotton, not rayon, silky.",
          username: "butter_bridge"
        })
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Not found: Article not found")
          })
      })
  
      test('400: Bad article ID', () => {
        return request(app)
        .post("/api/articles/noon/comments")
        .send({
          body: "The beautiful thing about dog is that it exists. Got to find out what kind of dog these are; not cotton, not rayon, silky.",
          username: "butter_bridge"
        })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request")
          })
      })

    test("400: Missing required fields", () => {
      return request(app)
        .post("/api/articles/1/comments")
        .send({
          username: "butter_bridge"
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Missing required fields")
        })
    })

    test("404: Username does not exist", () => {
      return request(app)
        .post("/api/articles/1/comments")
        .send({
          body: "This is a test comment",
          username: "nonexistent_user"
        })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: User not found")
        })
    })
  })
})

describe('"PATCH /api/articles/:article_id"', () => {
  describe('Happy path', () => {
    test("200: Returns updated article", () => {
      return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body: { article } }) => {
        const old_votes = article.votes
        return request(app)
          .patch("/api/articles/1")
          .send({inc_votes: 1})
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article).toEqual(expect.objectContaining({
              "article_id": 1,
              "votes": old_votes + 1
            }))
        })
      })
    })

    test("200: Updates the article", () => {
      // Checking votes before
      return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then(({ body: { article } }) => {
        const old_votes = article.votes
        // Updating votes by one
        return request(app)
          .patch("/api/articles/1")
          .send({inc_votes: 1})
          .expect(200)
          .then(() => {
            // Checking votes after update
            return request(app)
            .get("/api/articles/1")
            .expect(200)
            .then(({ body: { article } }) => {
              expect(article).toEqual(expect.objectContaining({
                "article_id": 1,
                "votes": old_votes + 1
              }))
            })
          })
      })
    })
  })

  describe('Sad path', () => {
    test('404: No article with that id', () => {
      return request(app)
        .patch("/api/articles/1000000")
        .send({inc_votes: 1})
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: Article not found")
        })
      })

      test('400: Bad article ID', () => {
        return request(app)
          .patch("/api/articles/cow")
          .send({inc_votes: 1})
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request")
          })
      })

      test("400: Missing required fields", () => {
        return request(app)
          .patch("/api/articles/1")
          .send({})
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request: Missing required fields")
          })
      })

      test("400: Invalid inc_votes type", () => {
        return request(app)
        .patch("/api/articles/1")
        .send({ inc_votes: "not a number" })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).toBe("Bad request: Invalid input format");
        })
      })
  })
})


describe('DELETE /api/comments/:comment_id', () => {
  describe('Happy path', () => {
    test('204: successfully deleted', () => {
      return request(app)
      .del("/api/comments/1")
      .expect(204)
      .then(() => {
        return db.query("SELECT * FROM comments WHERE comment_id = $1", [1])
        .then((res) => {
          expect(res.rows.length).toBe(0)
        })
      })
      
    })
})

describe('Sad path', () => {
  test('404: No comment with that id', () => {
    return request(app)
    .del("/api/comments/10000000")
    .expect(404)
    .then(({ body: { msg } }) => {
      expect(msg).toBe("Not found: Comment not found")
      })
    })
    
    test('400: Bad article ID', () => {
      return request(app)
      .del("/api/comments/cow")
      .expect(400)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("Bad request: Invalid comment ID")
      })
    })
  });
})

describe('PATCH /api/commets/:comment_id', () => {
  describe('Happy path', () => {
    test('200: responds with an object that has the updated comment under a key of comment', () => {
      return db.query(`SELECT * FROM comments WHERE comment_id = $1`, [1])
        .then(({ rows }) => {
          const comment = rows[0]
          const old_votes = comment.votes
          return request(app)
            .patch("/api/comments/1")
            .send({inc_votes: 1})
            .expect(200)
            .then(({ body: { comment } }) => {
              expect(comment).toEqual(expect.objectContaining({
                "comment_id": 1,
                "votes": old_votes + 1
              }))
          })
        })
    })
  });

  describe('Sad path', () => {
    test('404: No comment with that id', () => {
    return request(app)
      .patch("/api/comments/1000000")
      .send({inc_votes: 1})
      .expect(404)
      .then(({ body: { msg } }) => {
        expect(msg).toBe("Not found: No comment found with that ID")
      })
    })

    test('400: Bad comment ID', () => {
      return request(app)
        .patch("/api/comments/cow")
        .send({inc_votes: 1})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request")
        })
    })

    test("400: Missing required fields", () => {
      return request(app)
        .patch("/api/comments/1")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Missing required fields")
        })
    })

    test("400: Invalid inc_votes type", () => {
      return request(app)
      .patch("/api/comments/1")
      .send({ inc_votes: "not a number" })
      .expect(400)
      .then(({ body }) => {
        expect(body.msg).toBe("Bad request: Invalid input format");
      })
    });
  });
})

describe("GET /api/users", () => {
  describe('Happy path', () => {
    test("200: Responds with an object containing all users", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body: { users } }) => {
          expect(Array.isArray(users)).toBe(true)
          expect(users.length).toBeGreaterThan(0)
          users.forEach((user) => {
            expect(user).toEqual(expect.objectContaining({
              username: expect.any(String),
              name: expect.any(String),
              avatar_url: expect.any(String)
            }))
          })
        })
    })
  })

  describe('Get user by username', () => {
    describe('Happy path', () => {
      test('200: Responds with an object that has the correct user at the key user', () => {
        return request(app)
        .get("/api/users/butter_bridge")
        .expect(200)
        .then(({ body: { user } }) => {
          expect(user).toEqual(expect.objectContaining({
            username: "butter_bridge",
            name: expect.any(String),
            avatar_url: expect.any(String),
          }))
        })
      });
    });

    describe('Sad path', () => {
      test('404: No user found', () => {
        return request(app)
        .get("/api/users/not_a_user")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: User not found")
        })
      });
    });
  });
})

describe('"POST /api/articles"', () => {
  describe('Happy path', () => {
    test('200: responds with an object containing posted article under the key article', () => {
        return request(app)
        .post("/api/articles")
        .send({
          author: 'butter_bridge',
          title: 'Test Article Title',
          body: 'This is the body of the test article.',
          topic: 'paper'
        })
        .expect(201)
        .then(({ body: { article } }) => {
          expect(article).toEqual(
            expect.objectContaining({
              article_id: expect.any(Number),
              article_img_url: expect.any(String),
              author: "butter_bridge",
              body: "This is the body of the test article.",
              created_at: expect.any(String),
              title: "Test Article Title",
              topic: "paper",
              votes: 0,
            })
          );
        })
      })
    });

  describe('Sad path', () => {
    test("400: Missing required fields", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: 'butter_bridge',
          body: 'This is the body of the test article.',
          topic: 'paper'
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Missing required fields")
        })
    })

    test('404: No user found', () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: 'not_a_user',
          title: 'Test Article Title',
          body: 'This is the body of the test article.',
          topic: 'paper'
        })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: User not found")
        })
    });

    test('400: bad topic', () => {
      const topic = "war"
      return request(app)
        .post("/api/articles")
        .send({
          author: 'not_a_user',
          title: 'Test Article Title',
          body: 'This is the body of the test article.',
          topic: 'not_a_topic'
        })
        .expect(404)
        .then(({body: {msg}}) => {
          expect(msg).toBe("Not found: Topic not found")
        })
    });

    test("400: Invalid data types in request body - author as number", () => {
      return request(app)
        .post("/api/articles")
        .send({
          author: 123, 
          title: "Test Article Title",
          body: "This is the body of the test article.",
          topic: "paper",
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Invalid input format")
        })
    })
    
    test("400: Invalid data types in request body - title as number", () => {
        return request(app)
          .post("/api/articles")
          .send({
            author: 'butter_bridge',
            title: 12345,
            body: "This is the body of the test article.",
            topic: "paper",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request: Invalid input format");
          });
      });
    
      test("400: Invalid data types in request body - body as number", () => {
        return request(app)
          .post("/api/articles")
          .send({
            author: 'butter_bridge',
            title: 'Valid Title',
            body: 12345,
            topic: "paper",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request: Invalid input format");
          })
      });
    
      test("400: Invalid data types in request body - topic as number", () => {
        return request(app)
          .post("/api/articles")
          .send({
            author: 'butter_bridge',
            title: 'Valid Title',
            body: 'Valid Body',
            topic: 12345,
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request: Invalid input format")
          })
      })
    
  });
});

describe('POST /api/topice', () => {
  describe('Happy path', () => {
    test('201: responds with object with the created topic at key topic', () => {
      return request(app)
        .post("/api/topics")
        .send({
           "slug": "topic name here",
          "description": "description here"
        })
        .expect(201)
        .then(({body}) => {
          const {topic} = body
          expect(topic).toEqual(expect.objectContaining({
            "slug": "topic name here",
            "description": "description here"
          }))

        })
    });
  });

  describe('Sad path', () => {
    test("400: Missing required fields", () => {
      return request(app)
        .post("/api/topics")
        .send({
          "slug": "topic name here",
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Missing required fields")
        })
    })

    test("400: Invalid data types in request body - slug as number", () => {
      return request(app)
        .post("/api/topics")
        .send({
           "slug": 101,
          "description": "description here"
        })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Invalid input format")
        })
    })

    test("400: Invalid data types in request body - body as number", () => {
      return request(app)
      .post("/api/topics")
      .send({
         "slug": "topic name here",
        "description": 200
      })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request: Invalid input format")
        })
    })
  });
});

describe('DELETE /api/articles/:article_id', () => {
  describe('Happy path', () => {
    test("204: successfully deletes the article", () => {
      return request(app)
        .delete("/api/articles/1")
        .expect(204)
        .then(() => {
          db.query('SELECT * FROM articles WHERE article_id = 1')
            .then((res) => {
              expect(res.rows).toHaveLength(0)
            })
        })
    });

    test("204: successfully deletes the comments", () => {
      return request(app)
        .del("/api/articles/1")
        .expect(204)
        .then(() => {
          db.query('SELECT * FROM comments WHERE article_id = 1')
            .then((res) => {
              expect(res.rows).toHaveLength(0)
            })
        })
    });
  });

  describe('Sad path', () => {
    test('404: No article with that id', () => {
      return request(app)
        .del("/api/articles/1000000")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Not found: Article not found")
        })
    })

    test('400: Invalid article ID', () => {
      return request(app)
        .del("/api/articles/id")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request")
        })
    })
  });
});