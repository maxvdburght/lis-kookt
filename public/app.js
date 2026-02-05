// === Lis kookt - Frontend App ===

const API = '/api/recipes';

// DOM elementen
const viewList = document.getElementById('view-list');
const viewForm = document.getElementById('view-form');
const viewDetail = document.getElementById('view-detail');
const recipesGrid = document.getElementById('recipes-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const formTitle = document.getElementById('form-title');
const recipeForm = document.getElementById('recipe-form');
const pasteArea = document.getElementById('paste-area');
const recipeDetail = document.getElementById('recipe-detail');

// State
let currentCategory = 'alle';
let searchTimeout = null;

// === Navigatie ===

function showView(view) {
  viewList.classList.add('hidden');
  viewForm.classList.add('hidden');
  viewDetail.classList.add('hidden');
  view.classList.remove('hidden');
  window.scrollTo(0, 0);
}

// Logo -> terug naar overzicht
document.getElementById('logo').addEventListener('click', () => {
  showView(viewList);
  loadRecipes();
});

// Nieuw recept knop
document.getElementById('btn-add').addEventListener('click', () => {
  resetForm();
  formTitle.textContent = 'Nieuw recept';
  showView(viewForm);
});

// Annuleren
document.getElementById('btn-cancel').addEventListener('click', () => {
  showView(viewList);
});

// Terug vanuit detail
document.getElementById('btn-back').addEventListener('click', () => {
  showView(viewList);
});

// === Categorieën ===

document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.cat-btn.active').classList.remove('active');
    btn.classList.add('active');
    currentCategory = btn.dataset.cat;
    loadRecipes();
  });
});

// === Zoeken ===

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadRecipes, 300);
});

// === Recepten laden ===

async function loadRecipes() {
  const search = searchInput.value.trim();
  const params = new URLSearchParams();

  if (currentCategory !== 'alle') {
    params.set('category', currentCategory);
  }
  if (search) {
    params.set('search', search);
  }

  try {
    const res = await fetch(`${API}?${params}`);
    const recipes = await res.json();
    renderRecipes(recipes);
  } catch (err) {
    recipesGrid.innerHTML = '<p class="loading">Fout bij laden van recepten.</p>';
  }
}

function renderRecipes(recipes) {
  if (recipes.length === 0) {
    recipesGrid.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }

  noResults.classList.add('hidden');

  const categoryIcons = {
    voorgerecht: '🥗',
    hoofdgerecht: '🍽️',
    dessert: '🍰',
    soep: '🍲',
    salade: '🥬',
    snack: '🍿',
    overig: '📖'
  };

  recipesGrid.innerHTML = recipes.map(r => `
    <div class="recipe-card" data-id="${r._id}">
      ${r.imageUrl
        ? `<img class="recipe-card-image" src="${escapeHtml(r.imageUrl)}" alt="${escapeHtml(r.title)}" loading="lazy" onerror="this.outerHTML='<div class=\\'recipe-card-placeholder\\'>${categoryIcons[r.category] || '📖'}</div>'">`
        : `<div class="recipe-card-placeholder">${categoryIcons[r.category] || '📖'}</div>`
      }
      <div class="recipe-card-body">
        <h3>${escapeHtml(r.title)}</h3>
        <span class="recipe-card-category">${escapeHtml(r.category)}</span>
      </div>
    </div>
  `).join('');

  // Klik handlers
  document.querySelectorAll('.recipe-card').forEach(card => {
    card.addEventListener('click', () => openRecipe(card.dataset.id));
  });
}

// === Recept openen ===

async function openRecipe(id) {
  try {
    const res = await fetch(`${API}/${id}`);
    const recipe = await res.json();
    renderDetail(recipe);
    showView(viewDetail);
  } catch (err) {
    toast('Fout bij openen recept');
  }
}

function renderDetail(recipe) {
  const categoryIcons = {
    voorgerecht: '🥗',
    hoofdgerecht: '🍽️',
    dessert: '🍰',
    soep: '🍲',
    salade: '🥬',
    snack: '🍿',
    overig: '📖'
  };

  recipeDetail.innerHTML = `
    ${recipe.imageUrl ? `<img class="detail-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.title)}" onerror="this.style.display='none'">` : ''}
    <div class="detail-content">
      <h2>${escapeHtml(recipe.title)}</h2>
      <span class="detail-category">${categoryIcons[recipe.category] || '📖'} ${escapeHtml(recipe.category)}</span>

      ${recipe.ingredients ? `
        <div class="detail-section">
          <h3>Ingrediënten</h3>
          <pre>${escapeHtml(recipe.ingredients)}</pre>
        </div>
      ` : ''}

      ${recipe.instructions ? `
        <div class="detail-section">
          <h3>Bereidingswijze</h3>
          <pre>${escapeHtml(recipe.instructions)}</pre>
        </div>
      ` : ''}
    </div>
  `;

  // Bewerken knop
  document.getElementById('btn-edit').onclick = () => editRecipe(recipe);

  // Verwijderen knop
  document.getElementById('btn-delete').onclick = () => deleteRecipe(recipe._id);
}

// === Recept toevoegen/bewerken ===

function resetForm() {
  document.getElementById('recipe-id').value = '';
  document.getElementById('recipe-title').value = '';
  document.getElementById('recipe-category').value = 'overig';
  document.getElementById('recipe-ingredients').value = '';
  document.getElementById('recipe-instructions').value = '';
  document.getElementById('recipe-image').value = '';
  pasteArea.value = '';
}

function editRecipe(recipe) {
  formTitle.textContent = 'Recept bewerken';
  document.getElementById('recipe-id').value = recipe._id;
  document.getElementById('recipe-title').value = recipe.title;
  document.getElementById('recipe-category').value = recipe.category;
  document.getElementById('recipe-ingredients').value = recipe.ingredients;
  document.getElementById('recipe-instructions').value = recipe.instructions;
  document.getElementById('recipe-image').value = recipe.imageUrl || '';
  pasteArea.value = '';
  showView(viewForm);
}

recipeForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('recipe-id').value;
  const data = {
    title: document.getElementById('recipe-title').value,
    category: document.getElementById('recipe-category').value,
    ingredients: document.getElementById('recipe-ingredients').value,
    instructions: document.getElementById('recipe-instructions').value,
    imageUrl: document.getElementById('recipe-image').value
  };

  try {
    const url = id ? `${API}/${id}` : API;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      toast(err.error || 'Fout bij opslaan');
      return;
    }

    toast(id ? 'Recept bijgewerkt!' : 'Recept toegevoegd!');
    showView(viewList);
    loadRecipes();
  } catch (err) {
    toast('Fout bij opslaan recept');
  }
});

// === Verwijderen ===

async function deleteRecipe(id) {
  if (!confirm('Weet je zeker dat je dit recept wilt verwijderen?')) return;

  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast('Fout bij verwijderen');
      return;
    }
    toast('Recept verwijderd');
    showView(viewList);
    loadRecipes();
  } catch (err) {
    toast('Fout bij verwijderen recept');
  }
}

// === Toast meldingen ===

function toast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2500);
}

// === Hulpfuncties ===

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// === PWA Service Worker registratie ===

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .catch(err => console.log('SW registratie mislukt:', err));
  });
}

// === Start ===
loadRecipes();
