'use strict'

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');

const app = express();
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

app.get('/', (req, res) => res.send('Testing 1, 2, 3, 4, 5, eat'));
// TO DO: ensure that this is linked to routes and pages
// TO DO: write out different ways to search the API using different titles, ingredients, and
app.get('/api/json/recipes/ingredients', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/filter.php'
  let query = '';
  // look into this more not sure it is correct.
  if(req.query.strMeal) query += `${req.query.strMeal}`;
  superagent.get(url)
    .query({'i': query})
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/name', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/search.php'
  let query = '';
  // look into this more not sure it is correct.
  if(req.query.name) query += `${req.query.name}`;
  superagent.get(url)
    .query({'s': query})
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/categories', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/filter.php'
  let query = '';
  // look into this more not sure it is correct.
  if(req.query.strMeal) query += `${req.query.strMeal}`;
  superagent.get(url)
    .query({'c': query})
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/area', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/filter.php'
  let query = '';
  // look into this more not sure it is correct.
  if(req.query.strMeal) query += `${req.query.strMeal}`;
  superagent.get(url)
    .query({'a': query})
    .then(response => res.send(response.body.meals));
});


///// DATABASE LOADER /////
///////////////////////////
function loadDB() {

  client.query(`
    CREATE TABLE IF NOT EXISTS
    meals (
      meal_id SERIAL PRIMARY KEY,
      category VARCHAR (225) NOT NULL,
      area VARCHAR (225) NOT NULL
    );`
  )
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    ingredients (
      id SERIAL PRIMARY KEY,
      meal_id INTEGER NOT NULL REFERENCES meals(meal_id),
      name VARCHAR (225),
      measure VARCHAR (225)
  );`)
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    instructions (
      id SERIAL PRIMARY KEY,
      meal_id INTEGER NOT NULL REFERENCES meals(meal_id),
      sequence INTEGER NOT NULL,
      category VARCHAR (225),
      body TEXT NOT NULL,
      duration INT
  );`)
    .catch(console.error);
}

loadDB();

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
