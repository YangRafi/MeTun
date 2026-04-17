const request = require('supertest');
const app = require('../app');

describe('AUTH API', () => {

  test('POST /api/auth/signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Test',
        surname: 'User',
        email: `test${Date.now()}@mail.com`,
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  test('POST /api/auth/login', async () => {
    const email = `login${Date.now()}@mail.com`;

    await request(app).post('/api/auth/signup').send({
      name: 'Test',
      surname: 'User',
      email,
      password: '123456'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email,
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  test('GET /api/auth/check', async () => {
    const agent = request.agent(app);

    const email = `check${Date.now()}@mail.com`;

    await agent.post('/api/auth/signup').send({
      name: 'Test',
      surname: 'User',
      email,
      password: '123456'
    });

    await agent.post('/api/auth/login').send({
      email,
      password: '123456'
    });

    const res = await agent.get('/api/auth/check');

    expect(res.statusCode).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });

});