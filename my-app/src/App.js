import React, { useState } from "react";

function RecipeApp() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [ingredientPairs, setIngredientPairs] = useState([]);
  const [filteredPairs, setFilteredPairs] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Normalize ingredient function to handle measurement variations
  const normalizeIngredient = (ingredient) => {
    return ingredient
      .toLowerCase()
      .replace(/\(.*?\)/g, "")  // Remove parentheses and content inside them
      .replace(/\d+/g, "")  // Remove any numbers
      .replace(/[^a-z\s]/g, "")  // Remove non-alphabetic characters except spaces
      .trim();  // Trim whitespace
  };

  // File upload and parsing
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      parseRecipes(content);
    };
    reader.readAsText(file);
  };

  const parseRecipes = (content) => {
    const recipesArray = [];
    const blocks = content.split(/\r?\n\r?\n/).filter((block) => block.trim() !== "");

    for (let i = 0; i < blocks.length; i += 2) {
      const headerBlock = blocks[i];
      const ingredientsBlock = blocks[i + 1] || "";

      const headerMatch = headerBlock.match(/^Recipe\s+\d+:\s+(.*)$/i);
      if (!headerMatch) continue;
      const recipeName = headerMatch[1].trim();

      let lines = ingredientsBlock.split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "");
      if (lines[0] && /^Ingredients:/i.test(lines[0])) {
        lines.shift();
      }

      const ingredients = lines.filter((line) => line.startsWith("-")).map((line) => line.replace(/^-\s*/, "").toLowerCase());

      recipesArray.push({
        name: recipeName,
        ingredients,
        instructions: "",
      });
    }

    setRecipes(recipesArray);
    setFilteredRecipes(recipesArray);
    analyzeIngredientPairs(recipesArray);
  };

  // Analyze ingredient pairs
  const analyzeIngredientPairs = (recipesArray) => {
    const pairsCount = {};

    recipesArray.forEach((recipe) => {
      const { ingredients } = recipe;
      if (!ingredients || ingredients.length < 2) return;

      // Normalize ingredients before creating pairs
      const normalizedIngredients = ingredients.map(normalizeIngredient);

      for (let i = 0; i < normalizedIngredients.length; i++) {
        for (let j = i + 1; j < normalizedIngredients.length; j++) {
          const pair = [normalizedIngredients[i], normalizedIngredients[j]].sort().join(", ");
          pairsCount[pair] = (pairsCount[pair] || 0) + 1;
        }
      }
    });

    const filteredPairs = Object.entries(pairsCount)
      .filter(([_, count]) => count >= 2)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count);

    setIngredientPairs(filteredPairs);
  };

  // Search for recipes by ingredient
  const handleSearch = () => {
    if (!ingredientSearch) {
      setFilteredRecipes(recipes);
      return;
    }
    const filtered = recipes.filter((recipe) =>
      recipe.ingredients.some((ing) => ing.includes(ingredientSearch.toLowerCase().trim()))
    );
    setFilteredRecipes(filtered);
  };

  // Search for a recipe by name
  const handleRecipeLookup = () => {
    const match = recipes.find((recipe) =>
      recipe.name.toLowerCase().includes(recipeSearch.toLowerCase().trim())
    );
    if (match) {
      setSelectedRecipe(match);
    } else {
      setSelectedRecipe(null);
      alert("Recipe not found");
    }
  };

  // Search ingredient pairings
  const handleSearchPairing = () => {
    if (!ingredientSearch.trim()) return;

    const searchTerm = normalizeIngredient(ingredientSearch.trim());

    const ingredientCounts = {};
    const pairedWith = {};

    ingredientPairs.forEach((pairObj) => {
      const ingredientsList = pairObj.pair.split(", ").map((ing) => normalizeIngredient(ing));

      if (ingredientsList.includes(searchTerm)) {
        ingredientsList.forEach((ingredient) => {
          if (ingredient !== searchTerm) {
            ingredientCounts[ingredient] = (ingredientCounts[ingredient] || 0) + pairObj.count;

            if (!pairedWith[ingredient]) {
              pairedWith[ingredient] = [];
            }
            pairedWith[ingredient].push(pairObj.pair);
          }
        });
      }
    });

    const sortedPairs = Object.entries(ingredientCounts)
      .map(([ingredient, count]) => ({ ingredient, count, pairs: pairedWith[ingredient] }))
      .sort((a, b) => b.count - a.count);

    setFilteredPairs(sortedPairs);
  };
  // Function to add ingredient to selected list
  const addIngredient = (ingredient) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
  };

  // Function to download selected ingredients as a text file
  const downloadIngredients = () => {
    const text = selectedIngredients.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "selected_ingredients.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Pookie's Online Recipe Numberer</h1>

      <div>
        <input type="file" accept=".txt" onChange={handleFileUpload} />
      </div>

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter an ingredient"
          value={ingredientSearch}
          onChange={(e) => setIngredientSearch(e.target.value)}
        />
        <button onClick={handleSearch}>Search Recipes by Ingredient</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Lookup Recipe by Name</h2>
        <input
          type="text"
          placeholder="Enter recipe name"
          value={recipeSearch}
          onChange={(e) => setRecipeSearch(e.target.value)}
        />
        <button onClick={handleRecipeLookup}>Lookup Recipe</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Search Ingredient Pairings</h3>
        <div>
          <input
            type="text"
            placeholder="Enter ingredient"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
          />
          <button onClick={handleSearchPairing}>Search Ingredient Pairings</button>
        </div>

        {filteredPairs.length > 0 ? (
          <ul>
            {filteredPairs.map((pairObj, index) => (
              <li key={index}>
                {pairObj.ingredient} ({pairObj.count} recipes)
                <ul>
                  {pairObj.pairs.map((pair, pairIndex) => (
                    <li key={pairIndex}>{pair}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pairings found</p>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Filtered Recipes</h2>
        <ul>
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe, index) => (
              <li key={index}>
                <strong>{recipe.name}</strong>
              </li>
            ))
          ) : (
            <p>No recipes found for the ingredient.</p>
          )}
        </ul>
      </div>
      {selectedRecipe && (
        <div style={{ marginTop: "20px" }}>
          <h3>Ingredients for {selectedRecipe.name}:</h3>
          <ul>
            {selectedRecipe.ingredients.map((ing, index) => (
              <li key={index}>
                {ing} <button onClick={() => addIngredient(ing)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedIngredients.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>Selected Ingredients:</h3>
          <ul>
            {selectedIngredients.map((ing, index) => (
              <li key={index}>{ing}</li>
            ))}
          </ul>
          <button onClick={downloadIngredients}>Download List</button>
        </div>
      )}
    </div>
  );
}

export default RecipeApp;
