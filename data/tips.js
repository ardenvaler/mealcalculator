/*!
 * Mise — Sage's tip library
 * -----------------------------------------------------------------------------
 * Each tip has a menu that loads straight into the calculator.
 * menu.items: [foodId, quantity, unit] — unit is a standard unit (g, ml, tsp,
 * tbsp, cup, …) or one of the food's own portion units (e.g. "large" for eggs).
 * `featured: true` tips appear as quick starters on the empty plate.
 * Run `node scripts/validate-data.mjs` after editing — it checks every id/unit.
 */
window.MiseTipCategories = [
  { key: "protein", label: "Protein", icon: "protein", hue: 24 },
  { key: "plant", label: "Plant-based", icon: "legume", hue: 105 },
  { key: "fiber", label: "Fiber & grains", icon: "carb", hue: 62 },
  { key: "veg", label: "Veg & fruit", icon: "veg", hue: 145 },
  { key: "fats", label: "Smart fats", icon: "fat", hue: 85 },
  { key: "salt", label: "Less salt", icon: "spice", hue: 8 },
  { key: "sugar", label: "Less sugar", icon: "sweet", hue: 320 },
  { key: "micro", label: "Vitamins & minerals", icon: "sparkle", hue: 265 },
  { key: "portion", label: "Portions", icon: "scale", hue: 200 },
  { key: "habit", label: "Habits", icon: "target", hue: 40 },
  { key: "hydrate", label: "Hydration", icon: "drink", hue: 195 },
  { key: "local", label: "Local favourites", icon: "fruit", hue: 350 }
];

window.MiseTips = [
  /* ───────────── Protein ───────────── */
  {
    id: "weigh-raw", cat: "habit", featured: true,
    title: "Weigh meat raw, pick the matching type",
    body: "Meat loses around a quarter of its weight as water when it cooks, so 100 g raw is roughly 75 g cooked. Weigh before cooking and choose the “raw” type — or weigh after and choose “cooked”.",
    menu: { name: "Chicken breast, olive oil & spinach", servings: 1, items: [
      ["chicken-breast-skinless-raw", 100, "g"], ["olive-oil-extra-virgin", 1, "tsp"], ["spinach-raw", 150, "g"],
      ["garlic-raw", 5, "g"], ["salt-table", 0.125, "tsp"], ["black-pepper-ground", 0.25, "tsp"]
    ] }
  },
  {
    id: "protein-every-meal", cat: "protein",
    title: "Spread protein across the day",
    body: "Muscles use protein best in doses of roughly 20–40 g per meal rather than one huge dinner. Anchor each meal with a palm-sized portion of protein.",
    menu: { name: "Grilled chicken power plate", servings: 1, items: [
      ["chicken-breast-skinless-raw", 150, "g"], ["rice-brown-cooked", 150, "g"], ["broccoli-steamed", 120, "g"],
      ["olive-oil-extra-virgin", 1, "tsp"], ["garlic-raw", 6, "g"], ["lemon-juice", 1, "tbsp"],
      ["salt-table", 0.25, "tsp"], ["black-pepper-ground", 0.25, "tsp"]
    ] }
  },
  {
    id: "eggs-breakfast", cat: "protein",
    title: "Start the day with eggs",
    body: "Two eggs bring about 13 g of complete protein plus vitamin D and B12 for roughly 140 kcal. A protein-rich breakfast helps keep mid-morning cravings in check.",
    menu: { name: "Veggie egg scramble on toast", servings: 1, items: [
      ["egg-whole-raw", 2, "large"], ["spinach-raw", 40, "g"], ["tomato-cherry-raw", 80, "g"], ["onion-raw", 30, "g"],
      ["olive-oil-extra-virgin", 1, "tsp"], ["bread-whole-wheat", 32, "g"], ["salt-table", 0.125, "tsp"], ["black-pepper-ground", 0.25, "tsp"]
    ] }
  },
  {
    id: "greek-yogurt", cat: "protein",
    title: "Greek yogurt doubles the protein",
    body: "Straining removes whey, so Greek yogurt carries about twice the protein of regular yogurt. Buy it plain and sweeten with fruit instead of the flavoured versions.",
    menu: { name: "Berry protein bowl", servings: 1, items: [
      ["yogurt-greek-nonfat", 200, "g"], ["blueberries-raw", 75, "g"], ["strawberries-raw", 75, "g"],
      ["granola", 30, "g"], ["chia-seeds", 1, "tbsp"], ["honey", 1, "tsp"]
    ] }
  },
  {
    id: "fish-twice", cat: "protein", featured: true,
    title: "Fish twice a week",
    body: "Oily fish like salmon, mackerel and sardines provide the omega-3 fats EPA and DHA, linked with heart health. Most guidelines suggest two portions a week, one of them oily.",
    menu: { name: "Salmon, quinoa & asparagus", servings: 1, items: [
      ["salmon-atlantic-farmed-raw", 140, "g"], ["quinoa-cooked", 150, "g"], ["asparagus-raw", 100, "g"],
      ["lemon-juice", 1, "tbsp"], ["olive-oil-extra-virgin", 1, "tsp"], ["dill-fresh", 1, "tbsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "lean-mince", cat: "protein",
    title: "Choose the leaner mince",
    body: "Going from 80% to 90% lean beef saves roughly 70 kcal and several grams of saturated fat per 100 g — with slightly more protein, not less.",
    menu: { name: "Lean beef & bean chili", servings: 1, items: [
      ["beef-ground-90-raw", 120, "g"], ["kidney-beans-cooked", 100, "g"], ["passata", 150, "g"], ["onion-raw", 60, "g"],
      ["bell-pepper-red-raw", 60, "g"], ["chili-powder", 1, "tsp"], ["cumin-ground", 0.5, "tsp"],
      ["olive-oil-extra-virgin", 1, "tsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "snack-protein", cat: "protein",
    title: "Snacks that pair protein with fiber",
    body: "An apple with peanut butter keeps you full far longer than a biscuit with the same calories — protein and fiber both slow digestion.",
    menu: { name: "Apple & peanut butter", servings: 1, items: [
      ["apple-raw", 180, "g"], ["peanut-butter-smooth", 1, "tbsp"]
    ] }
  },

  /* ───────────── Plant-based ───────────── */
  {
    id: "tempeh-power", cat: "plant", featured: true,
    title: "Tempeh is a fermented powerhouse",
    body: "Fermentation makes soybeans easier to digest: tempeh gives about 19–20 g protein per 100 g, plus fiber that tofu doesn't have. Steam it or pan-fry with just a little oil.",
    menu: { name: "Tempeh & bok choy stir-fry", servings: 1, items: [
      ["tempeh-raw", 120, "g"], ["bok-choy-raw", 120, "g"], ["bell-pepper-red-raw", 60, "g"], ["garlic-raw", 6, "g"],
      ["chili-birdseye-raw", 3, "g"], ["soy-sauce-low-sodium", 1, "tbsp"], ["sesame-oil-toasted", 1, "tsp"], ["rice-brown-cooked", 120, "g"]
    ] }
  },
  {
    id: "tofu-calcium", cat: "plant",
    title: "Tofu can be a calcium source",
    body: "Tofu set with calcium sulfate is one of the best non-dairy sources of calcium. Pair it with leafy greens like bok choy for a bigger boost.",
    menu: { name: "Ginger tofu & greens", servings: 1, items: [
      ["tofu-firm-raw", 150, "g"], ["bok-choy-raw", 150, "g"], ["rice-jasmine-cooked", 120, "g"], ["ginger-fresh", 5, "g"],
      ["oyster-sauce", 1, "tbsp"], ["sesame-seeds", 1, "tsp"], ["vegetable-oil", 1, "tsp"]
    ] }
  },
  {
    id: "beans-meat", cat: "plant",
    title: "Swap half the meat for lentils",
    body: "Replacing half the mince with lentils cuts saturated fat, adds fiber and keeps protein high — and the sauce tastes just as rich.",
    menu: { name: "Half-and-half lentil bolognese", servings: 1, items: [
      ["beef-ground-90-raw", 60, "g"], ["lentils-red-cooked", 100, "g"], ["passata", 150, "g"], ["onion-raw", 50, "g"],
      ["carrot-raw", 50, "g"], ["garlic-raw", 6, "g"], ["olive-oil-extra-virgin", 1, "tsp"], ["pasta-whole-wheat-cooked", 140, "g"],
      ["oregano-dried", 0.5, "tsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "mix-plant-proteins", cat: "plant",
    title: "Mix plant proteins over the day",
    body: "Grains and legumes complement each other's amino acids. You don't need to combine them in one meal — eating a variety through the day does the job.",
    menu: { name: "Rice & black bean bowl", servings: 1, items: [
      ["rice-brown-cooked", 150, "g"], ["black-beans-cooked", 120, "g"], ["avocado-raw", 50, "g"], ["tomato-raw", 80, "g"],
      ["red-onion-raw", 25, "g"], ["cilantro-fresh", 1, "tbsp"], ["lime-juice", 1, "tbsp"], ["cumin-ground", 0.5, "tsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "edamame-snack", cat: "plant",
    title: "Edamame: a snack with real protein",
    body: "A cup of shelled edamame has around 18 g protein and 8 g fiber. Steam, sprinkle with a pinch of salt and chili, done.",
    menu: { name: "Chili-lime edamame", servings: 1, items: [
      ["edamame-shelled-cooked", 155, "g"], ["salt-sea", 0.125, "tsp"], ["chili-flakes", 0.25, "tsp"], ["lime-juice", 1, "tsp"]
    ] }
  },
  {
    id: "hummus-veg", cat: "plant",
    title: "Dip veg, not chips",
    body: "Hummus brings protein and fiber from chickpeas; raw veg sticks add crunch, water and vitamins for very few calories.",
    menu: { name: "Hummus & crudités", servings: 1, items: [
      ["hummus", 60, "g"], ["carrot-raw", 80, "g"], ["cucumber-raw", 80, "g"], ["bell-pepper-red-raw", 60, "g"], ["pita-white", 30, "g"]
    ] }
  },
  {
    id: "b12-plant", cat: "plant",
    title: "Plant-based? Mind your B12",
    body: "Vitamin B12 is found almost only in animal foods. Vegans need fortified foods — nutritional yeast, fortified plant milk — or a supplement.",
    menu: { name: "Turmeric tofu scramble", servings: 1, items: [
      ["tofu-firm-raw", 150, "g"], ["nutritional-yeast", 1, "tbsp"], ["turmeric-ground", 0.25, "tsp"], ["spinach-raw", 40, "g"],
      ["tomato-cherry-raw", 60, "g"], ["olive-oil-extra-virgin", 1, "tsp"], ["black-pepper-ground", 0.25, "tsp"], ["soy-milk-unsweetened", 200, "g"]
    ] }
  },

  /* ───────────── Fiber & whole grains ───────────── */
  {
    id: "brown-rice", cat: "fiber",
    title: "Go brown — or red — with your rice",
    body: "Brown and red rice keep the bran layer: several times the fiber of white rice, more magnesium, and a gentler rise in blood sugar.",
    menu: { name: "Nasi merah plate", servings: 1, items: [
      ["rice-red-cooked", 150, "g"], ["chicken-breast-skinless-grilled", 100, "g"], ["long-beans-raw", 80, "g"],
      ["cucumber-raw", 60, "g"], ["sambal-oelek", 1, "tsp"]
    ] }
  },
  {
    id: "oats-breakfast", cat: "fiber", featured: true,
    title: "Oats for a steady morning",
    body: "Oats contain beta-glucan, a soluble fiber shown to help lower LDL cholesterol. Rolled or steel-cut oats keep you fuller than instant sachets.",
    menu: { name: "Banana-cinnamon oats", servings: 1, items: [
      ["oats-rolled-raw", 50, "g"], ["milk-2-percent", 200, "g"], ["banana-raw", 100, "g"], ["cinnamon-ground", 0.5, "tsp"],
      ["walnuts", 15, "g"], ["chia-seeds", 1, "tsp"]
    ] }
  },
  {
    id: "fiber-30", cat: "fiber",
    title: "Aim for about 30 g of fiber a day",
    body: "Most people eat about half that. Legumes, whole grains, veg, fruit, nuts and seeds each add a few grams — together they add up fast.",
    menu: { name: "Fiber-loaded lentil salad", servings: 1, items: [
      ["lentils-green-cooked", 150, "g"], ["mixed-greens-raw", 50, "g"], ["tomato-cherry-raw", 100, "g"], ["cucumber-raw", 80, "g"],
      ["red-onion-raw", 20, "g"], ["cheese-feta", 30, "g"], ["olive-oil-extra-virgin", 2, "tsp"], ["vinegar-balsamic", 1, "tbsp"], ["pumpkin-seeds", 10, "g"]
    ] }
  },
  {
    id: "whole-wheat-pasta", cat: "fiber",
    title: "Whole-wheat pasta, same comfort",
    body: "Whole-wheat pasta has roughly twice the fiber of regular pasta and more minerals. Cook it al dente for slower digestion.",
    menu: { name: "Whole-wheat pasta primavera", servings: 1, items: [
      ["pasta-whole-wheat-cooked", 160, "g"], ["zucchini-raw", 100, "g"], ["tomato-cherry-raw", 100, "g"], ["garlic-raw", 6, "g"],
      ["olive-oil-extra-virgin", 2, "tsp"], ["cheese-parmesan", 10, "g"], ["basil-fresh", 1, "tbsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "chia-pudding", cat: "fiber",
    title: "Chia thickens and adds fiber",
    body: "Two tablespoons of chia bring about 8 g of fiber plus plant omega-3 (ALA). Soak them in milk overnight for an effortless pudding.",
    menu: { name: "Mango chia pudding", servings: 1, items: [
      ["chia-seeds", 2, "tbsp"], ["soy-milk-unsweetened", 180, "g"], ["mango-raw", 100, "g"],
      ["coconut-desiccated-unsweetened", 1, "tbsp"], ["honey", 1, "tsp"]
    ] }
  },
  {
    id: "potato-skin", cat: "fiber",
    title: "Keep the skins on",
    body: "A good share of a potato's fiber sits in and just under the skin. Scrub, don't peel — and bake or boil rather than fry.",
    menu: { name: "Jacket potato & cottage cheese", servings: 1, items: [
      ["potato-baked", 220, "g"], ["cheese-cottage-low-fat", 100, "g"], ["spring-onion-raw", 10, "g"],
      ["broccoli-steamed", 100, "g"], ["black-pepper-ground", 0.25, "tsp"]
    ] }
  },

  /* ───────────── Veg & fruit ───────────── */
  {
    id: "half-plate-veg", cat: "veg",
    title: "Fill half your plate with veg",
    body: "Vegetables add volume, fiber and micronutrients for very few calories, so the plate looks generous while the energy stays moderate.",
    menu: { name: "Half-veg chicken plate", servings: 1, items: [
      ["chicken-breast-skinless-grilled", 120, "g"], ["broccoli-steamed", 100, "g"], ["carrot-boiled", 80, "g"],
      ["cauliflower-raw", 80, "g"], ["rice-jasmine-cooked", 100, "g"], ["olive-oil-extra-virgin", 1, "tsp"]
    ] }
  },
  {
    id: "rainbow", cat: "veg",
    title: "Eat the rainbow",
    body: "Different colours signal different phytonutrients — carotenoids in orange, anthocyanins in purple, glucosinolates in greens. Aim for at least three colours a meal.",
    menu: { name: "Rainbow quinoa bowl", servings: 1, items: [
      ["quinoa-cooked", 120, "g"], ["bell-pepper-red-raw", 50, "g"], ["bell-pepper-yellow-raw", 50, "g"], ["carrot-raw", 50, "g"],
      ["cabbage-green-raw", 50, "g"], ["edamame-shelled-cooked", 60, "g"], ["mango-raw", 50, "g"], ["avocado-raw", 40, "g"],
      ["sesame-seeds", 1, "tsp"], ["vinegar-rice", 1, "tbsp"], ["soy-sauce-low-sodium", 1, "tsp"]
    ] }
  },
  {
    id: "frozen-veg", cat: "veg",
    title: "Frozen veg count too",
    body: "Frozen vegetables are picked ripe and frozen fast, so they're nutritionally on par with fresh — and they never wilt in the fridge.",
    menu: { name: "Quick veggie fried rice", servings: 1, items: [
      ["rice-brown-cooked", 150, "g"], ["green-peas-cooked", 60, "g"], ["carrot-boiled", 50, "g"], ["corn-sweet-boiled", 40, "g"],
      ["egg-whole-raw", 1, "large"], ["soy-sauce-low-sodium", 1, "tbsp"], ["vegetable-oil", 1, "tsp"], ["spring-onion-raw", 10, "g"]
    ] }
  },
  {
    id: "salad-first", cat: "veg",
    title: "Start with a salad",
    body: "Eating a large, low-calorie salad before the main course has been shown to reduce how much people eat in the rest of the meal.",
    menu: { name: "Big green starter salad", servings: 1, items: [
      ["lettuce-romaine-raw", 80, "g"], ["arugula-raw", 30, "g"], ["cucumber-raw", 80, "g"], ["tomato-cherry-raw", 80, "g"],
      ["olive-oil-extra-virgin", 1, "tsp"], ["vinegar-apple-cider", 1, "tbsp"], ["salt-table", 0.125, "tsp"]
    ] }
  },
  {
    id: "fruit-whole", cat: "veg",
    title: "Eat fruit whole, not juiced",
    body: "Whole fruit keeps its fiber, which slows sugar absorption and fills you up. A tall glass of juice can hold the sugar of three or four oranges.",
    menu: { name: "Fresh fruit bowl", servings: 1, items: [
      ["orange-raw", 130, "g"], ["apple-raw", 150, "g"], ["kiwi-raw", 70, "g"], ["grapes-raw", 60, "g"]
    ] }
  },
  {
    id: "steam-veg", cat: "veg",
    title: "Steam, don't drown, your veg",
    body: "Water-soluble vitamins like C and folate leach into cooking water. Steaming or a quick stir-fry keeps more of them on the plate.",
    menu: { name: "Steamed ginger fish & veg", servings: 1, items: [
      ["snapper-raw", 150, "g"], ["broccoli-steamed", 100, "g"], ["carrot-raw", 60, "g"], ["ginger-fresh", 5, "g"],
      ["soy-sauce-low-sodium", 1, "tbsp"], ["spring-onion-raw", 10, "g"], ["rice-jasmine-cooked", 120, "g"]
    ] }
  },

  /* ───────────── Smart fats ───────────── */
  {
    id: "olive-oil", cat: "fats",
    title: "Cook with extra-virgin olive oil",
    body: "Extra-virgin olive oil is rich in monounsaturated fat and polyphenols. Using it in place of butter is one of the simplest heart-friendly swaps.",
    menu: { name: "Mediterranean roast veg & chickpeas", servings: 1, items: [
      ["zucchini-raw", 100, "g"], ["eggplant-raw", 100, "g"], ["bell-pepper-red-raw", 80, "g"], ["red-onion-raw", 50, "g"],
      ["chickpeas-canned", 100, "g"], ["olive-oil-extra-virgin", 1, "tbsp"], ["oregano-dried", 0.5, "tsp"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "measure-oil", cat: "fats",
    title: "Measure your oil",
    body: "Oil is the most energy-dense food there is: one tablespoon is about 120 kcal. Free-pouring can add 300 kcal without you noticing — use a spoon.",
    menu: { name: "Stir-fry with just 1 tsp oil", servings: 1, items: [
      ["chicken-breast-skinless-raw", 120, "g"], ["broccoli-raw", 100, "g"], ["bell-pepper-red-raw", 60, "g"], ["mushroom-shiitake-raw", 50, "g"],
      ["garlic-raw", 6, "g"], ["canola-oil", 1, "tsp"], ["soy-sauce-low-sodium", 1, "tbsp"], ["rice-jasmine-cooked", 120, "g"]
    ] }
  },
  {
    id: "avocado-swap", cat: "fats",
    title: "Avocado instead of butter or mayo",
    body: "Avocado brings monounsaturated fat, fiber and potassium. It works best replacing butter or mayo — not stacked on top of them.",
    menu: { name: "Avocado & egg sourdough", servings: 1, items: [
      ["bread-sourdough", 60, "g"], ["avocado-raw", 70, "g"], ["egg-whole-boiled", 1, "large"], ["tomato-cherry-raw", 50, "g"],
      ["chili-flakes", 0.25, "tsp"], ["lemon-juice", 1, "tsp"], ["salt-sea", 0.125, "tsp"]
    ] }
  },
  {
    id: "nuts-handful", cat: "fats",
    title: "A handful of nuts a day",
    body: "Regular nut eaters tend to have better heart health. A handful (about 30 g) is 170–200 kcal, so portion them out rather than eating from the bag.",
    menu: { name: "Nuts & apple snack", servings: 1, items: [
      ["almonds-raw", 15, "g"], ["walnuts", 15, "g"], ["apple-raw", 150, "g"]
    ] }
  },
  {
    id: "lighter-santan", cat: "fats",
    title: "Go lighter on santan",
    body: "Full-fat coconut milk is around 200 kcal per 100 ml, mostly saturated fat. Light coconut milk keeps a curry creamy for far less.",
    menu: { name: "Lighter chicken curry", servings: 1, items: [
      ["chicken-breast-skinless-raw", 120, "g"], ["coconut-milk-light", 100, "g"], ["potato-raw", 100, "g"], ["carrot-raw", 50, "g"],
      ["shallot-raw", 20, "g"], ["garlic-raw", 6, "g"], ["curry-powder", 1, "tsp"], ["lemongrass-fresh", 15, "g"],
      ["kaffir-lime-leaves", 1, "g"], ["salt-table", 0.25, "tsp"], ["rice-white-cooked", 120, "g"]
    ] }
  },
  {
    id: "bake-not-fry", cat: "fats",
    title: "Bake or air-fry instead of deep-frying",
    body: "Deep-fried foods soak up oil. Oven-baked fries or air-fried tempeh can save 100 kcal or more per portion.",
    menu: { name: "Oven fries & grilled chicken", servings: 1, items: [
      ["french-fries-baked", 150, "g"], ["chicken-breast-skinless-grilled", 120, "g"], ["ketchup", 1, "tbsp"],
      ["lettuce-romaine-raw", 60, "g"], ["tomato-raw", 80, "g"]
    ] }
  },

  /* ───────────── Less salt ───────────── */
  {
    id: "low-sodium-soy", cat: "salt",
    title: "Choose reduced-sodium soy sauce",
    body: "Regular soy sauce carries about 900 mg of sodium per tablespoon. Reduced-sodium versions cut that by roughly 40% with nearly the same flavour.",
    menu: { name: "Ginger-soy chicken rice bowl", servings: 1, items: [
      ["chicken-thigh-skinless-raw", 130, "g"], ["soy-sauce-low-sodium", 1, "tbsp"], ["honey", 1, "tsp"], ["ginger-fresh", 5, "g"],
      ["garlic-raw", 5, "g"], ["rice-jasmine-cooked", 150, "g"], ["broccoli-steamed", 100, "g"], ["sesame-seeds", 1, "tsp"]
    ] }
  },
  {
    id: "herbs-not-salt", cat: "salt",
    title: "Season with herbs, acid and heat",
    body: "Lime, garlic, chili, ginger and fresh herbs light up flavour so you need less salt. Salt is always easier to add than to take away.",
    menu: { name: "Herby lime grilled fish", servings: 1, items: [
      ["tilapia-raw", 150, "g"], ["lime-juice", 1, "tbsp"], ["garlic-raw", 5, "g"], ["cilantro-fresh", 2, "tbsp"],
      ["chili-red-raw", 5, "g"], ["olive-oil-extra-virgin", 1, "tsp"], ["salt-table", 0.125, "tsp"],
      ["rice-brown-cooked", 120, "g"], ["cucumber-raw", 80, "g"]
    ] }
  },
  {
    id: "instant-noodles", cat: "salt",
    title: "Upgrade your instant noodles",
    body: "Most of the sodium hides in the seasoning sachet — use half. Then add an egg and a handful of greens for protein and fiber.",
    menu: { name: "Upgraded instant noodles", servings: 1, items: [
      ["instant-noodles-dry", 75, "g"], ["egg-whole-raw", 1, "large"], ["bok-choy-raw", 80, "g"],
      ["spring-onion-raw", 10, "g"], ["chili-flakes", 0.25, "tsp"]
    ] }
  },
  {
    id: "stock-cubes", cat: "salt",
    title: "Watch the stock cubes",
    body: "A single bouillon cube can hold around 900 mg of sodium or more. Use half, or simmer your own broth from bones and aromatics.",
    menu: { name: "Clear chicken & veg soup", servings: 1, items: [
      ["chicken-stock", 250, "g"], ["chicken-breast-skinless-boiled", 80, "g"], ["carrot-raw", 60, "g"], ["cabbage-green-raw", 60, "g"],
      ["celery-raw", 30, "g"], ["potato-raw", 80, "g"], ["spring-onion-raw", 10, "g"], ["black-pepper-ground", 0.25, "tsp"]
    ] }
  },
  {
    id: "potassium-balance", cat: "salt",
    title: "Boost potassium to balance sodium",
    body: "Potassium helps counter sodium's effect on blood pressure. Beans, potatoes, sweet potatoes, bananas, spinach and yogurt are great sources.",
    menu: { name: "Potassium-rich sweet potato bowl", servings: 1, items: [
      ["sweet-potato-baked", 150, "g"], ["spinach-raw", 60, "g"], ["black-beans-cooked", 80, "g"], ["yogurt-plain-whole", 80, "g"],
      ["avocado-raw", 40, "g"], ["lime-juice", 1, "tsp"]
    ] }
  },

  /* ───────────── Less sugar ───────────── */
  {
    id: "sweeten-fruit", cat: "sugar",
    title: "Sweeten with fruit",
    body: "Mashed banana, dates or berries add sweetness along with fiber and potassium — instead of spoonfuls of sugar.",
    menu: { name: "Date & banana smoothie", servings: 1, items: [
      ["milk-skim", 240, "g"], ["banana-raw", 100, "g"], ["dates-medjool", 24, "g"], ["peanut-butter-smooth", 1, "tbsp"], ["oats-rolled-raw", 20, "g"]
    ] }
  },
  {
    id: "dont-drink-sugar", cat: "sugar",
    title: "Don't drink your sugar",
    body: "A can of cola holds about 35 g of sugar — roughly 8 teaspoons. Water, unsweetened tea or sparkling water with lime are free.",
    menu: { name: "Unsweetened iced lemon tea", servings: 1, items: [
      ["tea-black-brewed", 300, "g"], ["lemon-juice", 1, "tbsp"], ["mint-fresh", 1, "tbsp"]
    ] }
  },
  {
    id: "condensed-milk", cat: "sugar",
    title: "Go easy on condensed milk",
    body: "Sweetened condensed milk is more than half sugar. A splash of regular milk with just a teaspoon of condensed keeps kopi susu creamy for far fewer calories.",
    menu: { name: "Lighter kopi susu", servings: 1, items: [
      ["coffee-brewed", 200, "g"], ["milk-2-percent", 60, "g"], ["milk-condensed-sweetened", 1, "tsp"]
    ] }
  },
  {
    id: "dark-chocolate", cat: "sugar",
    title: "Pick dark chocolate",
    body: "70%+ dark chocolate has less sugar and more fiber, iron and magnesium than milk chocolate. Two squares go a long way.",
    menu: { name: "Dark chocolate & berries", servings: 1, items: [
      ["dark-chocolate-70", 20, "g"], ["strawberries-raw", 100, "g"], ["almonds-raw", 10, "g"]
    ] }
  },
  {
    id: "kecap-manis", cat: "sugar",
    title: "Kecap manis is mostly sugar",
    body: "Sweet soy sauce is over half sugar by weight. Use a teaspoon for colour and gloss, then build flavour with garlic, shallots and chili.",
    menu: { name: "Lighter nasi goreng", servings: 1, items: [
      ["rice-white-cooked", 150, "g"], ["egg-whole-raw", 1, "large"], ["chicken-breast-skinless-raw", 60, "g"], ["shallot-raw", 15, "g"],
      ["garlic-raw", 5, "g"], ["kecap-manis", 1, "tsp"], ["sambal-oelek", 1, "tsp"], ["palm-olein", 2, "tsp"],
      ["cucumber-raw", 50, "g"], ["tomato-raw", 50, "g"]
    ] }
  },

  /* ───────────── Vitamins & minerals ───────────── */
  {
    id: "iron-vitc", cat: "micro",
    title: "Team up iron with vitamin C",
    body: "Iron from plants is absorbed several times better alongside vitamin C. Add bell pepper, tomato, citrus or guava to your beans and greens.",
    menu: { name: "Spinach, lentil & pepper sauté", servings: 1, items: [
      ["spinach-raw", 120, "g"], ["lentils-green-cooked", 120, "g"], ["bell-pepper-red-raw", 80, "g"], ["garlic-raw", 6, "g"],
      ["lemon-juice", 1, "tbsp"], ["olive-oil-extra-virgin", 1, "tsp"], ["salt-table", 0.125, "tsp"]
    ] }
  },
  {
    id: "vitamin-d", cat: "micro",
    title: "Find vitamin D on your plate",
    body: "Few foods contain vitamin D: oily fish, egg yolks and UV-exposed mushrooms are the best. Sunlight remains the main source for most people.",
    menu: { name: "Sardines & egg on toast", servings: 1, items: [
      ["sardines-canned-oil", 60, "g"], ["egg-whole-boiled", 1, "large"], ["bread-whole-wheat", 32, "g"], ["tomato-raw", 80, "g"], ["mushroom-button-raw", 60, "g"]
    ] }
  },
  {
    id: "calcium-teri", cat: "micro",
    title: "Calcium beyond the milk glass",
    body: "Yogurt, cheese, calcium-set tofu, tiny fish eaten with their bones like teri, and leafy greens all add to the ~1,000 mg you need daily.",
    menu: { name: "Teri, tofu & greens", servings: 1, items: [
      ["anchovies-dried", 15, "g"], ["tofu-firm-raw", 100, "g"], ["bok-choy-raw", 100, "g"], ["rice-white-cooked", 120, "g"],
      ["garlic-raw", 5, "g"], ["chili-red-raw", 5, "g"], ["palm-olein", 1, "tsp"]
    ] }
  },
  {
    id: "magnesium", cat: "micro",
    title: "Magnesium lives in seeds, nuts & greens",
    body: "Many adults fall short on magnesium. Pumpkin seeds, almonds, spinach, black beans and whole grains are rich sources.",
    menu: { name: "Magnesium boost salad", servings: 1, items: [
      ["spinach-baby-raw", 60, "g"], ["quinoa-cooked", 100, "g"], ["black-beans-cooked", 80, "g"], ["pumpkin-seeds", 15, "g"],
      ["avocado-raw", 40, "g"], ["lime-juice", 1, "tbsp"], ["olive-oil-extra-virgin", 1, "tsp"]
    ] }
  },
  {
    id: "vitamin-a", cat: "micro",
    title: "Orange & green for vitamin A",
    body: "Carrots, sweet potatoes, pumpkin and dark leafy greens are full of beta-carotene, which your body turns into vitamin A. A little fat helps you absorb it.",
    menu: { name: "Roasted orange veg & kale", servings: 1, items: [
      ["sweet-potato-raw", 150, "g"], ["carrot-raw", 80, "g"], ["pumpkin-raw", 100, "g"], ["kale-raw", 40, "g"],
      ["olive-oil-extra-virgin", 2, "tsp"], ["rosemary-dried", 0.5, "tsp"]
    ] }
  },
  {
    id: "guava-vitc", cat: "micro",
    title: "Guava beats oranges on vitamin C",
    body: "Gram for gram, guava has about four times the vitamin C of an orange. Papaya and kiwi are excellent sources too.",
    menu: { name: "Tropical vitamin-C bowl", servings: 1, items: [
      ["guava-raw", 100, "g"], ["papaya-raw", 100, "g"], ["kiwi-raw", 70, "g"], ["lime-juice", 1, "tsp"]
    ] }
  },

  /* ───────────── Portions ───────────── */
  {
    id: "volumetrics", cat: "portion",
    title: "Bulk up with low-energy-dense food",
    body: "Foods full of water and fiber — soups, salads, veg, fruit — fill you up for fewer calories. That's the whole idea behind “volumetrics”.",
    menu: { name: "Big vegetable & bean soup", servings: 1, items: [
      ["chicken-stock", 300, "g"], ["cabbage-green-raw", 100, "g"], ["carrot-raw", 80, "g"], ["tomato-raw", 100, "g"],
      ["zucchini-raw", 80, "g"], ["onion-raw", 50, "g"], ["kidney-beans-cooked", 60, "g"], ["olive-oil-extra-virgin", 1, "tsp"], ["salt-table", 0.125, "tsp"]
    ] }
  },
  {
    id: "rice-scoop", cat: "portion",
    title: "Mind the rice scoop",
    body: "A heaped rice-cooker paddle can be 200–250 g of rice (around 300 kcal). Try about 120 g and pile more veg on the side.",
    menu: { name: "Balanced nasi campur", servings: 1, items: [
      ["rice-white-cooked", 120, "g"], ["chicken-breast-skinless-grilled", 80, "g"], ["tempeh-fried", 40, "g"], ["long-beans-raw", 60, "g"],
      ["bean-sprouts-raw", 40, "g"], ["cucumber-raw", 50, "g"], ["sambal-oelek", 1, "tsp"]
    ] }
  },
  {
    id: "cauli-rice", cat: "portion",
    title: "Half rice, half cauliflower",
    body: "Mixing riced cauliflower into rice roughly halves the calories of the base and adds fiber and vitamin C — most people barely notice.",
    menu: { name: "Half-and-half rice bowl", servings: 1, items: [
      ["rice-jasmine-cooked", 80, "g"], ["cauliflower-raw", 100, "g"], ["chicken-breast-skinless-raw", 80, "g"], ["egg-whole-raw", 1, "large"],
      ["spring-onion-raw", 10, "g"], ["soy-sauce-low-sodium", 2, "tsp"], ["vegetable-oil", 1, "tsp"]
    ] }
  },
  {
    id: "post-workout", cat: "portion",
    title: "Refuel after training",
    body: "After exercise, carbs plus about 20–30 g of protein help restore glycogen and support muscle repair.",
    menu: { name: "Recovery smoothie", servings: 1, items: [
      ["milk-skim", 300, "g"], ["banana-raw", 120, "g"], ["yogurt-greek-nonfat", 100, "g"], ["oats-rolled-raw", 30, "g"], ["peanut-butter-smooth", 1, "tbsp"]
    ] }
  },
  {
    id: "meal-prep", cat: "portion",
    title: "Batch-cook, then divide",
    body: "Cook once, eat four times: set Servings to 4 and Mise shows what each lunch box holds. Healthy becomes the easy default all week.",
    menu: { name: "Meal-prep chicken & veg (4 boxes)", servings: 4, items: [
      ["chicken-breast-skinless-raw", 600, "g"], ["rice-brown-cooked", 600, "g"], ["broccoli-raw", 400, "g"], ["bell-pepper-red-raw", 200, "g"],
      ["zucchini-raw", 200, "g"], ["olive-oil-extra-virgin", 2, "tbsp"], ["paprika", 2, "tsp"], ["garlic-powder", 1, "tsp"], ["salt-table", 1, "tsp"]
    ] }
  },

  /* ───────────── Habits ───────────── */
  {
    id: "plate-method", cat: "habit",
    title: "Use the plate method",
    body: "Half the plate veg, a quarter protein, a quarter whole grains or starch, plus a little healthy fat. Once it's a habit, no counting needed.",
    menu: { name: "Plate-method salmon dinner", servings: 1, items: [
      ["broccoli-steamed", 100, "g"], ["carrot-boiled", 60, "g"], ["mixed-greens-raw", 30, "g"], ["salmon-atlantic-farmed-baked", 110, "g"],
      ["rice-brown-cooked", 120, "g"], ["olive-oil-extra-virgin", 1, "tsp"]
    ] }
  },
  {
    id: "slow-down", cat: "habit",
    title: "Slow down at meals",
    body: "Fullness signals take around 20 minutes to register. Put the chopsticks down between bites and you'll likely eat less without trying.",
    menu: { name: "Cold soba & tofu bowl", servings: 1, items: [
      ["soba-cooked", 150, "g"], ["tofu-firm-raw", 100, "g"], ["cucumber-raw", 60, "g"], ["edamame-shelled-cooked", 50, "g"],
      ["soy-sauce-low-sodium", 1, "tbsp"], ["sesame-oil-toasted", 1, "tsp"], ["nori-dried", 2.5, "g"]
    ] }
  },

  /* ───────────── Hydration ───────────── */
  {
    id: "water-first", cat: "hydrate",
    title: "Drink water before you snack",
    body: "Thirst is easily mistaken for hunger. Have a glass of water first; if you're still hungry ten minutes later, eat.",
    menu: { name: "Hydrating watermelon plate", servings: 1, items: [
      ["watermelon-raw", 200, "g"], ["cucumber-raw", 100, "g"], ["mint-fresh", 1, "tbsp"], ["lime-juice", 1, "tsp"], ["water", 250, "g"]
    ] }
  },
  {
    id: "coconut-water", cat: "hydrate",
    title: "Coconut water after a sweaty day",
    body: "It's naturally rich in potassium and lighter than most sports drinks — handy after sweating in the heat. For everyday thirst, plain water wins.",
    menu: { name: "Tropical rehydration", servings: 1, items: [
      ["coconut-water", 330, "g"], ["pineapple-raw", 100, "g"]
    ] }
  },

  /* ───────────── Local favourites ───────────── */
  {
    id: "local-greens", cat: "local",
    title: "Love your local greens",
    body: "Kangkung, bayam and daun singkong are rich in vitamin A, vitamin C and iron. Stir-fry them quickly with garlic to keep their colour and nutrients.",
    menu: { name: "Tumis kangkung & tempe", servings: 1, items: [
      ["water-spinach-raw", 150, "g"], ["garlic-raw", 6, "g"], ["shallot-raw", 15, "g"], ["chili-red-raw", 10, "g"],
      ["oyster-sauce", 1, "tsp"], ["palm-olein", 1, "tsp"], ["tempeh-raw", 80, "g"], ["rice-white-cooked", 120, "g"]
    ] }
  },
  {
    id: "gado-gado", cat: "local",
    title: "Gado-gado is a balanced classic",
    body: "Veg, egg, tofu and tempeh with peanut sauce cover protein, fiber and healthy fats. Go easy on the sauce and crackers and it's a near-perfect plate.",
    menu: { name: "Gado-gado", servings: 1, items: [
      ["long-beans-raw", 60, "g"], ["bean-sprouts-raw", 50, "g"], ["cabbage-green-raw", 50, "g"], ["water-spinach-raw", 50, "g"],
      ["potato-boiled", 80, "g"], ["egg-whole-boiled", 1, "large"], ["tofu-fried", 50, "g"], ["tempeh-fried", 40, "g"],
      ["peanut-sauce", 45, "g"], ["lontong", 100, "g"], ["prawn-crackers-fried", 8, "g"]
    ] }
  },
  {
    id: "sayur-bening", cat: "local",
    title: "Sayur bening: light and nourishing",
    body: "This clear amaranth-and-corn soup is low in fat and full of greens — lovely next to a little tempeh and rice.",
    menu: { name: "Sayur bening bayam", servings: 1, items: [
      ["amaranth-leaves-raw", 100, "g"], ["corn-sweet-raw", 60, "g"], ["shallot-raw", 10, "g"], ["garlic-raw", 3, "g"],
      ["salt-table", 0.25, "tsp"], ["rice-white-cooked", 120, "g"], ["tempeh-fried", 50, "g"]
    ] }
  },
  {
    id: "soto-broth", cat: "local",
    title: "Soto ayam: go for the clear broth",
    body: "Clear-broth soups are hydrating and much lower in fat than santan curries. Load up on sprouts and cabbage, and finish with lime.",
    menu: { name: "Soto ayam, lighter", servings: 1, items: [
      ["chicken-breast-skinless-boiled", 100, "g"], ["chicken-stock", 300, "g"], ["rice-vermicelli-cooked", 60, "g"], ["bean-sprouts-raw", 40, "g"],
      ["cabbage-green-raw", 40, "g"], ["egg-whole-boiled", 1, "large"], ["turmeric-fresh", 5, "g"], ["lemongrass-fresh", 15, "g"],
      ["lime-juice", 1, "tbsp"], ["shallots-fried", 5, "g"], ["salt-table", 0.25, "tsp"]
    ] }
  },
  {
    id: "pepes", cat: "local",
    title: "Steam it in banana leaf",
    body: "Pepes and botok cook fish or tofu in their own juices with a spice paste — big flavour, almost no oil.",
    menu: { name: "Pepes ikan nila", servings: 1, items: [
      ["tilapia-raw", 150, "g"], ["shallot-raw", 15, "g"], ["garlic-raw", 5, "g"], ["turmeric-fresh", 5, "g"], ["chili-red-raw", 10, "g"],
      ["tomato-raw", 50, "g"], ["lemon-basil-fresh", 2, "tbsp"], ["salam-leaves", 1, "g"], ["salt-table", 0.25, "tsp"], ["rice-white-cooked", 120, "g"]
    ] }
  },
  {
    id: "teri-sambal", cat: "local",
    title: "Sambal adds flavour, not calories",
    body: "Fresh sambal is mostly chili, shallot and tomato — a spoonful brings vitamin C and heat for very few calories. It's the frying oil that adds up.",
    menu: { name: "Grilled chicken & sambal plate", servings: 1, items: [
      ["chicken-breast-skinless-grilled", 120, "g"], ["sambal-terasi", 1, "tbsp"], ["rice-white-cooked", 120, "g"],
      ["cucumber-raw", 60, "g"], ["cabbage-green-raw", 40, "g"], ["lemon-basil-fresh", 1, "tbsp"]
    ] }
  }
];
