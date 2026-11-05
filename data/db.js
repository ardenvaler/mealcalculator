/*!
 * Mise — ingredient library registry
 * -----------------------------------------------------------------------------
 * Every data file in /data calls  MiseDB.add(groupKey, [items])  and this file
 * must be loaded before them. The item format is documented in data/SCHEMA.md.
 *
 * All nutrient values are per 100 g of the edible portion, in the state the
 * item's `type` describes (raw, cooked, dried, ...).
 */
(function (root) {
  "use strict";

  /* Order matters: it is the column order used across the app. */
  var NUTRIENTS = [
    "kcal",      // energy, kcal
    "protein",   // g
    "carbs",     // g, total carbohydrate (by difference, includes fiber & sugars)
    "fiber",     // g, total dietary fiber
    "sugar",     // g, total sugars
    "fat",       // g, total fat
    "satfat",    // g, saturated fat
    "chol",      // mg, cholesterol
    "sodium",    // mg
    "potassium", // mg
    "calcium",   // mg
    "iron",      // mg
    "magnesium", // mg
    "vitc",      // mg, vitamin C
    "vita",      // µg RAE, vitamin A
    "vitd",      // µg, vitamin D (D2 + D3)
    "b12"        // µg, vitamin B12
  ];

  /*
   * Groups and their sub-groups. `hue` drives the colour of each group in the
   * UI. A food's `sub` must be one of its group's `subs`.
   */
  var GROUPS = [
    { key: "protein", label: "Protein", hue: 24,
      subs: ["Poultry", "Beef", "Pork", "Lamb & goat", "Offal", "Processed meat", "Eggs", "Fish", "Shellfish", "Plant protein"] },
    { key: "veg", label: "Vegetables", hue: 145,
      subs: ["Leafy greens", "Cruciferous", "Roots & bulbs", "Alliums", "Fruiting veg", "Squash & gourds", "Pods & sprouts", "Stalks & shoots", "Mushrooms", "Sea vegetables"] },
    { key: "carb", label: "Grains & Starches", short: "Carbs", hue: 62,
      subs: ["Rice", "Noodles", "Pasta", "Bread & wraps", "Grains", "Breakfast cereals", "Tubers & starchy veg", "Flours & starches", "Crackers & snacks"] },
    { key: "legume", label: "Legumes", hue: 105,
      subs: ["Lentils", "Beans", "Chickpeas & peas", "Soy & edamame", "Legume products"] },
    { key: "fruit", label: "Fruits", hue: 350,
      subs: ["Tropical", "Citrus", "Berries", "Orchard", "Melons & grapes", "Dried fruit", "Avocado & coconut"] },
    { key: "dairy", label: "Dairy & Alternatives", short: "Dairy", hue: 225,
      subs: ["Milk", "Yogurt & kefir", "Cheese", "Cream", "Plant milk", "Coconut milk"] },
    { key: "fat", label: "Oils & Fats", short: "Oils", hue: 85,
      subs: ["Olive oil", "Seed & nut oils", "Tropical oils", "Butter & ghee", "Animal fats", "Margarine & shortening"] },
    { key: "nut", label: "Nuts & Seeds", short: "Nuts", hue: 40,
      subs: ["Nuts", "Seeds", "Nut & seed butters"] },
    { key: "spice", label: "Herbs & Spices", short: "Spices", hue: 125,
      subs: ["Salt", "Pepper & chili", "Ground spices", "Whole spices", "Dried herbs", "Fresh herbs", "Aromatics", "Seasoning blends", "Stock & umami"] },
    { key: "sauce", label: "Sauces & Condiments", short: "Sauces", hue: 8,
      subs: ["Soy & Asian sauces", "Chili & hot sauces", "Western condiments", "Dressings", "Vinegars", "Pastes & purées", "Cooking wines", "Dips & spreads"] },
    { key: "sweet", label: "Sweeteners & Baking", short: "Sweet", hue: 320,
      subs: ["Sugars", "Syrups & honey", "Sweeteners", "Chocolate & cocoa", "Jams & spreads", "Baking essentials"] },
    { key: "drink", label: "Drinks", hue: 195,
      subs: ["Water & electrolytes", "Coffee & tea", "Juices", "Soft & sports drinks", "Fermented & cultured"] }
  ];

  var db = root.MiseDB || {};
  db.version = "1.0.0";
  db.nutrients = NUTRIENTS;
  db.groups = GROUPS;
  db.foods = db.foods || [];

  db.add = function (group, items) {
    for (var i = 0; i < items.length; i++) {
      items[i].group = group;
      db.foods.push(items[i]);
    }
  };

  root.MiseDB = db;
})(typeof window !== "undefined" ? window : this);
