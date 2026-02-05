const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['voorgerecht', 'hoofdgerecht', 'dessert', 'soep', 'salade', 'snack', 'overig'],
    default: 'overig'
  },
  ingredients: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

recipeSchema.index({ title: 'text', ingredients: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
