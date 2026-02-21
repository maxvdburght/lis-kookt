require('dotenv').config();
const serverless = require('serverless-http');
const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../../models/recipe');

const app = express();
app.use(express.json());

// MongoDB verbinding cachen tussen function invocations
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database verbinding mislukt' });
  }
});

// Alle recepten ophalen (met zoek- en filteropties)
app.get('/api/recipes', async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category && category !== 'alle') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { ingredients: { $regex: search, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: 'Fout bij ophalen recepten', details: err.message });
  }
});

// Eén recept ophalen
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recept niet gevonden' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Fout bij ophalen recept' });
  }
});

// Nieuw recept toevoegen
app.post('/api/recipes', async (req, res) => {
  try {
    const { title, category, ingredients, instructions, imageUrl } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel is verplicht' });
    }
    const recipe = new Recipe({
      title: title.trim(),
      category: category || 'overig',
      ingredients: ingredients || '',
      instructions: instructions || '',
      imageUrl: imageUrl || ''
    });
    const saved = await recipe.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Fout bij opslaan recept', details: err.message });
  }
});

// Recept bijwerken
app.put('/api/recipes/:id', async (req, res) => {
  try {
    const { title, category, ingredients, instructions, imageUrl } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Titel is verplicht' });
    }
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        category: category || 'overig',
        ingredients: ingredients || '',
        instructions: instructions || '',
        imageUrl: imageUrl || ''
      },
      { new: true, runValidators: true }
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recept niet gevonden' });
    }
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ error: 'Fout bij bijwerken recept' });
  }
});

// Recept verwijderen
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recept niet gevonden' });
    }
    res.json({ message: 'Recept verwijderd' });
  } catch (err) {
    res.status(500).json({ error: 'Fout bij verwijderen recept' });
  }
});

module.exports.handler = serverless(app);
