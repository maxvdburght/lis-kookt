require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Recipe = require('./models/recipe');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connectie
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Verbonden met MongoDB'))
  .catch(err => console.error('MongoDB connectie fout:', err));

// === API Routes ===

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
    res.status(500).json({ error: 'Fout bij ophalen recepten' });
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
    res.status(500).json({ error: 'Fout bij opslaan recept' });
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

// SPA fallback - altijd index.html serveren
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lis kookt draait op http://localhost:${PORT}`);
});
