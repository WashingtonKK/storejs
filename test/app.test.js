const request = require('supertest');
const app = require('../src/app');

describe('Product CRUD', () => {
  beforeEach(() => {
    app.resetStore();
  });

  it('index page loads', async () => {
    const response = await request(app).get('/products');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Products');
  });

  it('root redirects to products index', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/products');
  });

  it('about page loads', async () => {
    const response = await request(app).get('/about');
    expect(response.status).toBe(200);
    expect(response.text).toContain('About StoreJS');
  });

  it('new page loads', async () => {
    const response = await request(app).get('/products/new');
    expect(response.status).toBe(200);
    expect(response.text).toContain('New Product');
  });

  it('create increases product count and redirects correctly', async () => {
    const createResponse = await request(app)
      .post('/products')
      .type('form')
      .send({ name: 'Desk lamp' });

    expect(createResponse.status).toBe(302);
    expect(createResponse.headers.location).toBe('/products/1');

    const showResponse = await request(app).get('/products/1');
    expect(showResponse.text).toContain('Product was successfully created.');

    const indexResponse = await request(app).get('/products');
    expect(indexResponse.text).toContain('Desk lamp');
  });

  it('show page loads', async () => {
    await request(app).post('/products').type('form').send({ name: 'Chair' });

    const response = await request(app).get('/products/1');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Chair');
  });

  it('edit page loads', async () => {
    await request(app).post('/products').type('form').send({ name: 'Table' });

    const response = await request(app).get('/products/1/edit');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Edit Product');
  });

  it('update persists change and redirects correctly', async () => {
    await request(app).post('/products').type('form').send({ name: 'Old Name' });

    const updateResponse = await request(app)
      .post('/products/1')
      .type('form')
      .send({ name: 'New Name' });

    expect(updateResponse.status).toBe(302);
    expect(updateResponse.headers.location).toBe('/products/1');

    const showResponse = await request(app).get('/products/1');
    expect(showResponse.text).toContain('New Name');
    expect(showResponse.text).toContain('Product was successfully updated.');
  });

  it('delete decreases product count and redirects correctly', async () => {
    await request(app).post('/products').type('form').send({ name: 'To Delete' });

    const deleteResponse = await request(app).post('/products/1/delete');

    expect(deleteResponse.status).toBe(302);
    expect(deleteResponse.headers.location).toBe('/products');

    const indexResponse = await request(app).get('/products');
    expect(indexResponse.text).not.toContain('To Delete');
    expect(indexResponse.text).toContain('Product was successfully deleted.');
  });

  it('returns 404 for missing product', async () => {
    const response = await request(app).get('/products/999');
    expect(response.status).toBe(404);
  });

  it('rejects creating a product with a blank name', async () => {
    const response = await request(app)
      .post('/products')
      .type('form')
      .send({ name: '   ' });

    expect(response.status).toBe(422);
    expect(response.text).toContain('be blank');

    const indexResponse = await request(app).get('/products');
    expect(indexResponse.text).toContain('No products yet');
  });

  it('rejects creating a product with a name over 100 characters', async () => {
    const response = await request(app)
      .post('/products')
      .type('form')
      .send({ name: 'a'.repeat(101) });

    expect(response.status).toBe(422);
    expect(response.text).toContain('Name is too long (maximum is 100 characters).');
  });

  it('trims whitespace from a valid name on create', async () => {
    await request(app).post('/products').type('form').send({ name: '  Lamp  ' });

    const showResponse = await request(app).get('/products/1');
    expect(showResponse.text).toContain('<h1>Lamp</h1>');
  });

  it('rejects updating a product to a blank name and keeps the old value', async () => {
    await request(app).post('/products').type('form').send({ name: 'Original' });

    const updateResponse = await request(app)
      .post('/products/1')
      .type('form')
      .send({ name: '' });

    expect(updateResponse.status).toBe(422);
    expect(updateResponse.text).toContain('be blank');

    const showResponse = await request(app).get('/products/1');
    expect(showResponse.text).toContain('Original');
  });
});
