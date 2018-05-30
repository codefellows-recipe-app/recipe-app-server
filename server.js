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

app.get('/', (req, res) => res.send('Testing 1, 2, 3, eat'));
// TO DO: ensure that this is linked to routes and pages
// TO DO: write out different ways to search the API using different titles, ingredients, and

app.get('/api/json/recipes/ingredients/:ingredients', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/filter.php'
  let query = [req.params.ingredients];
  // look into this more not sure it is correct.
  if (req.query.ingredients) query += `${req.query.ingredients}`;
  superagent.get(url)
    .query({ 'i': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/name/:name', (req, res) => {
  let url = 'https://www.themealdb.com/api/json/v1/1/search.php'
  let query = [req.params.name];
  // look into this more not sure it is correct.
  if (req.query.name) query += `${req.query.name}`;
  superagent.get(url)
    .query({ 's': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/categories/:category', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/filter.php`
  let query = [req.params.category];
  // look into this more not sure it is correct.
  if (req.query.categories) query += `${req.query.categories}`;
  superagent.get(url)
    .query({ 'c': query })
    .then(response => res.send(response.body.meals));
});

app.get('/api/json/recipes/area/:area', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/filter.php`
  let query = [req.params.area];
  // look into this more not sure it is correct.
  if (req.query.area) query += `${req.query.area}`;
  superagent.get(url)
    .query({ 'a': query })
    .then(response => res.send(response.body.meals));
});

// route to get a single recipe
app.get('/api/json/recipe/:id', (req, res) => {
  let url = `https://www.themealdb.com/api/json/v1/1/lookup.php`
  let query = [req.params.id];
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

      let SQL = 'INSERT INTO meals_table (meal_id, name, category, area) VALUES($1, $2, $3, $4) ON CONFLICT DO NOTHING;';
      let values = [meal.id, meal.name, meal.category, meal.area];
      client.query( SQL, values,
        function(err) {
          if (err) console.error(err)
          insertTwo();
        }
      )

      function insertTwo() {
        meal.ingredients.forEach(ingredient => {
          let SQL = 'INSERT INTO ingredients_table (meal_id, ingredients_id, measure) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;';
          let values = [meal.id, ingredient.name, ingredient.measure];
          client.query(SQL, values)
        })
        insertThree();
      }

      function insertThree() {
        meal.instructions.forEach(instruction => {
          let SQL = 'INSERT INTO instructions_table (meal_id, sequence, body, duration) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING;';
          let values = [meal.id, instruction.sequence, instruction.body, instruction.duration]
          client.query(SQL, values)
        })
      }
      // here is where we put in the code to load the database

      res.send(meal);
    })
    .catch(console.error);
});

app.get('/api/json/recipe/delete/:id', (req, res) => {
  res.send('1,2,3')
  let SQL = `DELETE FROM meals_table WHERE meal_id=$1;`;
  let values = req.params.id;
  client.query( SQL, values)
    .then(deleteTwo())


  function deleteTwo () {
    let SQL = `DELETE FROM ingredients_table WHERE meal_id=$1;`;
    let values = req.params.id;
    client.query( SQL, values)
      .then(deleteThree())
  }

  function deleteThree () {
    let SQL = `DELETE FROM instructions_table WHERE meal_id=$1;`;
    let values = req.params.id;
    client.query( SQL, values)
      .then(() => res.send('Delete complete'))
      .catch(console.error);
  }
});

loadDB();

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

///// DATABASE LOADER /////
///////////////////////////
function loadDB() {

  client.query(`
    CREATE TABLE IF NOT EXISTS
    meals_table (
      meal_id VARCHAR (255) PRIMARY KEY,
      name VARCHAR (225) NOT NULL,
      category VARCHAR (225) NOT NULL,
      area VARCHAR (225) NOT NULL);`
  )
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    ingredients_table (
      id SERIAL PRIMARY KEY,
      meal_id VARCHAR (255),
      ingredients_id VARCHAR (225),
      measure VARCHAR (225));`
  )
    .catch(console.error);

  client.query(`
    CREATE TABLE IF NOT EXISTS
    instructions_table (
      id SERIAL PRIMARY KEY,
      meal_id VARCHAR (255) NOT NULL,
      sequence INTEGER NOT NULL,
      body TEXT NOT NULL,
      duration INT);`
  )
    .catch(console.error);
}


