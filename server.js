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

app.use(cors());

app.get('/', (req, res) => res.send('Testing 1, 2, 3, eat'));
// TO DO: ensure that this is linked to routes and pages
// TO DO: write out different ways to search the API using different titles, ingredients, and

app.get('/api/json/recipes/ingredients:ingredients', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/filter.php'
  let query = req.params.ingredients;
  // look into this more not sure it is correct.
  if (req.query.ingredients) query += `${req.query.ingredients}`;
  superagent.get(url)
    .query({ 'i': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/name/:name', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/search.php'
  let query = req.params.name;
  // look into this more not sure it is correct.
  if (req.query.name) query += `${req.query.name}`;
  superagent.get(url)
    .query({ 's': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/categories/:category', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/filter.php`
  let query = req.params.category;
  // look into this more not sure it is correct.
  if (req.query.categories) query += `${req.query.categories}`;
  superagent.get(url)
    .query({ 'c': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/area/:area', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/filter.php`
  let query = req.params.area;
  // look into this more not sure it is correct.
  if (req.query.area) query += `${req.query.area}`;
  superagent.get(url)
    .query({ 'a': query })
    .then(response => res.send(response.body.meals));
});

// route to get a single recipe
app.get('/api/json/recipe/:id', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/lookup.php`
  let query = req.params.id;
  superagent.get(url)
    .query({ 'i': query })
    .then(response => {
      let rawMealData = response.body.meals[0];
      let meal = {};

      meal.id = rawMealData.idMeal;
      meal.name = rawMealData.strMeal;
      meal.category = rawMealData.strCategory;
      meal.area = rawMealData.strArea;
      meal.thumb = rawMealData.thumb;
      meal.tag = rawMealData.tags;
      meal.youTube = rawMealData.strYoutube
      meal.ingredients = [];

      for (let i = 1; i <= 20; i++) {
        if (rawMealData['strIngredient' + i] !== '' && rawMealData['strIngredient' + i] !== null) {
          meal.ingredients.push({ name: rawMealData['strIngredient' + i], measure: rawMealData['strMeasure' + i] });
        }
      }

      meal.instructions = rawMealData.strInstructions
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .split('.')
        .filter(instruction => instruction !== '')
        .map(instruction => instruction[0] === ' ' ? instruction.substring(1) : instruction)
        .map((instruction, i) => {
          return {
            sequence: i + 1,
            category: 'cook',
            body: instruction,
            duration: 0
          }
        });

      console.log('someone wants some meals!!!');
      console.log(meal);


      // here is where we put in the code to load the database

      res.send(meal);
    })
    .catch(console.error);

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
