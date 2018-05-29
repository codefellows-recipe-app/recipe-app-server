'use strict'

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const superagent = require('superagent');


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