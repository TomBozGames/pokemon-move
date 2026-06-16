// Cette clé est le nom utilisé dans localStorage pour sauvegarder la partie.
const STORAGE_KEY = "pokemonMoveSave";

const TOTAL_CUBES = 48;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

// Tous les éléments HTML que le script doit lire ou modifier.
// Les mettre ici évite de répéter document.querySelector partout dans le code.
const elements = {
    timer: document.querySelector("[data-timer]"),
    activeLine: document.querySelector("[data-active-line]"),
    progressCount: document.querySelector("[data-progress-count]"),
    progressBar: document.querySelector("[data-progress-bar]"),
    grid: document.querySelector("[data-grid]"),
    addCube: document.querySelector("[data-add-cube]"),
    addIcon: document.querySelector("[data-add-icon]"),
    addLabel: document.querySelector("[data-add-label]"),
    togglePokedex: document.querySelector("[data-toggle-pokedex]"),
    viewIcon: document.querySelector("[data-view-icon]"),
    viewLabel: document.querySelector("[data-view-label]"),
    backgroundMusic: document.querySelector("[data-background-music]"),
};

// Les noms sont en français parce que ce sont les textes visibles dans le jeu.
const POKEMON_NAMES = [
    null,
    "Bulbizarre", "Herbizarre", "Florizarre", "Salamèche", "Reptincel", "Dracaufeu",
    "Carapuce", "Carabaffe", "Tortank", "Chenipan", "Chrysacier", "Papilusion",
    "Aspicot", "Coconfort", "Dardargnan", "Roucool", "Roucoups", "Roucarnage",
    "Rattata", "Rattatac", "Piafabec", "Rapasdepic", "Abo", "Arbok",
    "Pikachu", "Raichu", "Sabelette", "Sablaireau", "Nidoran femelle",
    "Nidorina", "Nidoqueen", "Nidoran mâle", "Nidorino", "Nidoking",
    "Mélofée", "Mélodelfe", "Goupix", "Feunard", "Rondoudou", "Grodoudou",
    "Nosferapti", "Nosferalto", "Mystherbe", "Ortide", "Rafflesia", "Paras", "Parasect",
    "Mimitoss", "Aéromite", "Taupiqueur", "Triopikeur", "Miaouss", "Persian",
    "Psykokwak", "Akwakwak", "Férosinge", "Colossinge", "Caninos", "Arcanin",
    "Ptitard", "Têtarte", "Tartard", "Abra", "Kadabra", "Alakazam",
    "Machoc", "Machopeur", "Mackogneur", "Chétiflor", "Boustiflor", "Empiflor",
    "Tentacool", "Tentacruel", "Racaillou", "Gravalanch", "Grolem", "Ponyta",
    "Galopa", "Ramoloss", "Flagadoss", "Magnéti", "Magnéton", "Canarticho",
    "Doduo", "Dodrio", "Otaria", "Lamantine", "Tadmorv", "Grotadmorv", "Kokiyas",
    "Crustabri", "Fantominus", "Spectrum", "Ectoplasma", "Onix", "Soporifik", "Hypnomade",
    "Krabby", "Krabboss", "Voltorbe", "Électrode", "Nœunœuf", "Noadkoko",
    "Osselait", "Ossatueur", "Kicklee", "Tygnon", "Excelangue", "Smogo",
    "Smogogo", "Rhinocorne", "Rhinoféros", "Leveinard", "Saquedeneu", "Kangourex",
    "Hypotrempe", "Hypocéan", "Poissirène", "Poissoroy", "Stari", "Staross",
    "M. Mime", "Insécateur", "Lippoutou", "Élektek", "Magmar", "Scarabrute",
    "Tauros", "Magicarpe", "Léviator", "Lokhlass", "Métamorph", "Évoli",
    "Aquali", "Voltali", "Pyroli", "Porygon", "Amonita", "Amonistar",
    "Kabuto", "Kabutops", "Ptéra", "Ronflex", "Artikodin", "Électhor",
    "Sulfura", "Minidraco", "Draco", "Dracolosse", "Mewtwo", "Mew",
];

// Chaque tableau représente une lignée. Le premier id sert au tirage pondéré.
const RAW_EVOLUTION_LINES = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12], [13, 14, 15],
    [16, 17, 18], [19, 20], [21, 22], [23, 24], [25, 26], [27, 28],
    [29, 30, 31], [32, 33, 34], [35, 36], [37, 38], [39, 40], [41, 42],
    [43, 44, 45], [46, 47], [48, 49], [50, 51], [52, 53], [54, 55],
    [56, 57], [58, 59], [60, 61, 62], [63, 64, 65], [66, 67, 68],
    [69, 70, 71], [72, 73], [74, 75, 76], [77, 78], [79, 80], [81, 82],
    [83], [84, 85], [86, 87], [88, 89], [90, 91], [92, 93, 94], [95],
    [96, 97], [98, 99], [100, 101], [102, 103], [104, 105], [106], [107],
    [108], [109, 110], [111, 112], [113], [114], [115], [116, 117],
    [118, 119], [120, 121], [122], [123], [124], [125], [126], [127],
    [128], [129, 130], [131], [132], [133, 134, 135, 136], [137],
    [138, 139], [140, 141], [142], [143], [144], [145], [146],
    [147, 148, 149], [150], [151],
];

// On transforme les tableaux simples en objets plus faciles à lire dans le reste du code.
const EVOLUTION_LINES = RAW_EVOLUTION_LINES.map((evolutionLine) => ({
    baseId: evolutionLine[0],
    name: getPokemonName(evolutionLine[0]),
    weight: getLineWeight(evolutionLine[0]),
    evolutionLine,
}));

// Variable qui évite de relancer la musique plusieurs fois.
let musicHasStarted = false;

// L'objet principal du jeu. Tout ce qui change pendant la partie vit ici.
let gameState = initializeGameState();

// Les deux boutons du bas changent de rôle selon le contexte:
// - mode normal: ajouter des cubes / ouvrir le Pokédex
// - mode placement: annuler / confirmer
elements.addCube.addEventListener("click", handlePrimaryButtonClick);
elements.togglePokedex.addEventListener("click", handleSecondaryButtonClick);

// La musique démarre au premier geste du joueur, car les navigateurs bloquent l'autoplay.
document.addEventListener("pointerdown", startBackgroundMusic, { once: true });
document.addEventListener("keydown", startBackgroundMusic, { once: true });

if (typeof window !== "undefined") {
    // Fonction utilitaire disponible dans la console: resetPokemonMove()
    window.resetPokemonMove = resetGame;
}

startApp();

function startApp() {
    prepareBackgroundMusic();
    prepareCurrentWeek();
    renderApp();
    setInterval(updateTimer, 1000);
}

function initializeGameState() {
    // On essaie d'abord de reprendre une sauvegarde, sinon on crée une partie vide.
    const savedState = loadSavedState();
    const pokemon = createPokemonList(savedState?.pokemon);
    const selectedPokemonId = savedState?.selectedPokemonId ?? null;

    const state = {
        pokemon,
        selectedPokemonId,
        currentView: savedState?.currentView ?? "weekly",
        isPlacingCubes: false,
        pendingCubes: [],
        weekly: {
            weekKey: savedState?.weekly?.weekKey ?? null,
            activeLineBaseId: savedState?.weekly?.activeLineBaseId ?? null,
            targetPokemonIds: savedState?.weekly?.targetPokemonIds ?? [],
            cubes: normalizeSavedCubes(savedState?.weekly?.cubes ?? []),
        },
    };

    initializeStarterPokemon(state);

    function initializeStarterPokemon(state) {
        const eeveeLine = [133, 134, 135, 136];

        const hasAnyPokemon = state.pokemon.some((pokemon) => pokemon.obtained);

        if (hasAnyPokemon) {
            return;
        }

        eeveeLine.forEach((id) => {
            const pokemon = state.pokemon[id - 1];
            pokemon.seen = true;
            pokemon.obtained = true;
        });

        state.selectedPokemonId = 133;
        syncSelectedPokemon(state);
    }

    syncSelectedPokemon(state);

    return state;
}

function loadSavedState() {
    const rawState = localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
        return null;
    }

    try {
        return JSON.parse(rawState);
    } catch {
        return null;
    }
}

function createPokemonList(savedPokemon = []) {
    // On reconstruit toujours les 151 Pokémon depuis POKEMON_NAMES.
    // Si une sauvegarde existe, on recopie seulement ses états seen/obtained/selected.
    const savedById = new Map(savedPokemon.map((pokemon) => [pokemon.id, pokemon]));

    return POKEMON_NAMES.slice(1).map((name, index) => {
        const id = index + 1;
        const saved = savedById.get(id);

        return {
            id,
            name,
            seen: saved?.seen ?? false,
            obtained: saved?.obtained ?? false,
            selected: saved?.selected ?? false,
        };
    });
}

function normalizeSavedCubes(savedCubes) {
    // Les anciennes versions sauvegardaient seulement pokemonId.
    // Maintenant chaque cube garde aussi slotIndex pour rester dans la case choisie.
    const usedSlots = new Set();

    return savedCubes
        .map((cube, index) => ({
            pokemonId: cube.pokemonId,
            slotIndex: Number.isInteger(cube.slotIndex) ? cube.slotIndex : index,
        }))
        .filter((cube) => {
            const isValidSlot = cube.slotIndex >= 0 && cube.slotIndex < TOTAL_CUBES;
            const isValidPokemon = cube.pokemonId >= 1 && cube.pokemonId <= 151;
            const isAvailableSlot = !usedSlots.has(cube.slotIndex);

            if (isValidSlot && isValidPokemon && isAvailableSlot) {
                usedSlots.add(cube.slotIndex);
                return true;
            }

            return false;
        });
}

function syncSelectedPokemon(state) {
    // Si la sauvegarde dit qu'une étampe est sélectionnée, on vérifie qu'elle est obtenue.
    // Sinon on nettoie la sélection pour éviter un état impossible.
    const selectedPokemon = state.selectedPokemonId ? state.pokemon[state.selectedPokemonId - 1] : null;

    if (!selectedPokemon?.obtained) {
        state.selectedPokemonId = null;
    }

    state.pokemon.forEach((pokemon) => {
        pokemon.selected = pokemon.id === state.selectedPokemonId;
    });
}

function prepareBackgroundMusic() {
    if (!elements.backgroundMusic) {
        return;
    }

    elements.backgroundMusic.volume = 0.35;
}

function startBackgroundMusic() {
    if (musicHasStarted || !elements.backgroundMusic) {
        return;
    }

    musicHasStarted = true;

    // Les navigateurs bloquent souvent l'audio automatique; le premier clic le débloque.
    const playRequest = elements.backgroundMusic.play();

    if (playRequest) {
        playRequest.catch(() => {
            musicHasStarted = false;
        });
    }
}

function prepareCurrentWeek() {
    // Cette fonction garantit qu'une lignée active existe pour la semaine courante.
    // En mode réel, elle ne change que le lundi. En mode test, elle peut choisir dans l'ordre.
    const weekKey = getWeekKey(new Date());
    const hasNewWeek = gameState.weekly.weekKey !== weekKey;
    const activeLine = getActiveLine();

    if (!hasNewWeek && activeLine) {
        return;
    }

    const selectedLine = selectWeightedLine(
        activeLine?.baseId ?? gameState.weekly.activeLineBaseId
    );

    startWeeklyLine(selectedLine, weekKey);
}

function startWeeklyLine(selectedLine, weekKey = getWeekKey(new Date())) {
    // Démarrer une nouvelle lignée remet la grille à zéro, mais garde le Pokédex.
    // C'est important: les Pokémon obtenus restent obtenus d'une semaine à l'autre.
    gameState.isPlacingCubes = false;
    gameState.pendingCubes = [];
    gameState.weekly = {
        weekKey,
        activeLineBaseId: selectedLine?.baseId ?? null,
        targetPokemonIds: selectedLine ? getMissingPokemonIds(selectedLine) : [],
        cubes: [],
    };

    if (selectedLine) {
        markLineAsSeen(selectedLine);
    }

    saveGameState();
}

function selectWeightedLine(previousBaseId = null) {
    let availableLines = EVOLUTION_LINES.filter(
        (line) => !isLineComplete(line)
    );

    if (previousBaseId) {
        const filteredLines = availableLines.filter(
            (line) => line.baseId !== previousBaseId
        );

        if (filteredLines.length > 0) {
            availableLines = filteredLines;
        }
    }

    if (!availableLines.length) {
        return null;
    }

    const totalWeight = availableLines.reduce(
        (total, line) => total + line.weight,
        0
    );

    let roll = Math.random() * totalWeight;

    for (const line of availableLines) {
        roll -= line.weight;

        if (roll <= 0) {
            return line;
        }
    }

    return availableLines[availableLines.length - 1];
}

function getLineWeight(baseId) {
    if (baseId <= 26) {
        return 32;
    }

    if (baseId <= 51) {
        return 16;
    }

    if (baseId <= 76) {
        return 8;
    }

    if (baseId <= 101) {
        return 4;
    }

    if (baseId <= 126) {
        return 2;
    }

    return 1;
}

function markLineAsSeen(line) {
    line.evolutionLine.forEach((pokemonId) => {
        getPokemon(pokemonId).seen = true;
    });
}

function handlePrimaryButtonClick() {
    startBackgroundMusic();

    if (gameState.isPlacingCubes) {
        cancelCubePlacement();
        return;
    }

    startCubePlacement();
}

function handleSecondaryButtonClick() {
    startBackgroundMusic();

    if (gameState.isPlacingCubes) {
        confirmCubePlacement();
        return;
    }

    togglePokedex();
}

function startCubePlacement() {
    prepareCurrentWeek();

    if (gameState.weekly.cubes.length >= TOTAL_CUBES || !getActiveLine()) {
        return;
    }

    gameState.currentView = "weekly";
    gameState.isPlacingCubes = true;
    gameState.pendingCubes = [];
    renderApp();
}

function cancelCubePlacement() {
    gameState.isPlacingCubes = false;
    gameState.pendingCubes = [];
    renderApp();
}

function confirmCubePlacement() {
    // Seuls les cubes confirmés deviennent permanents.
    // Les pendingCubes sont donc fusionnés ici, et pas avant.
    const confirmedCubes = [...gameState.weekly.cubes, ...gameState.pendingCubes];

    gameState.weekly.cubes = confirmedCubes.sort((firstCube, secondCube) => firstCube.slotIndex - secondCube.slotIndex);
    gameState.isPlacingCubes = false;
    gameState.pendingCubes = [];

    updateObtainedPokemon();

    // --- LA SÉCURITÉ DE CHANGEMENT IMMÉDIAT A ÉTÉ RETIRÉE D'ICI ---

    saveGameState();
    renderApp();
}

function placePendingCube(slotIndex) {
    // En mode placement, cliquer sur une case vide ajoute un cube temporaire.
    // Cliquer sur un cube temporaire le retire. Les anciens cubes restent verrouillés.
    if (!gameState.isPlacingCubes || getCommittedCubeAt(slotIndex)) {
        return;
    }

    const existingPendingCube = getPendingCubeAt(slotIndex);

    if (existingPendingCube) {
        gameState.pendingCubes = gameState.pendingCubes.filter((cube) => cube.slotIndex !== slotIndex);
        renderApp();
        return;
    }

    if (getTotalPlacedCubeCount() >= TOTAL_CUBES) {
        return;
    }

    gameState.pendingCubes.push({
        slotIndex,
        pokemonId: getCurrentStampPokemonId(),
    });

    renderApp();
}

function updateObtainedPokemon() {
    const targets = gameState.weekly.targetPokemonIds;
    const cubeCount = gameState.weekly.cubes.length;

    targets.forEach((pokemonId, index) => {
        const threshold = getThreshold(index, targets.length);

        if (cubeCount >= threshold) {
            const pokemon = getPokemon(pokemonId);
            pokemon.seen = true;
            pokemon.obtained = true;

            if (!gameState.selectedPokemonId) {
                setSelectedStamp(pokemonId);
            }
        }
    });
}

function getCurrentStampPokemonId() {
    if (gameState.selectedPokemonId && getPokemon(gameState.selectedPokemonId).obtained) {
        return gameState.selectedPokemonId;
    }

    return gameState.weekly.targetPokemonIds[0] ?? gameState.weekly.activeLineBaseId;
}

function togglePokedex() {
    gameState.currentView = gameState.currentView === "weekly" ? "pokedex" : "weekly";
    saveGameState();
    renderApp();
}

function selectStamp(pokemonId) {
    const pokemon = getPokemon(pokemonId);

    if (!pokemon.obtained) {
        return;
    }

    setSelectedStamp(pokemonId);
    saveGameState();
    renderApp();
}

function setSelectedStamp(pokemonId) {
    gameState.selectedPokemonId = pokemonId;
    gameState.pokemon.forEach((currentPokemon) => {
        currentPokemon.selected = currentPokemon.id === pokemonId;
    });
}

function getHeaderCubeClassName(pokemon) {
    const classNames = ["cube"];

    if (pokemon.obtained) {
        classNames.push("cube--obtained");
    } else if (pokemon.seen) {
        classNames.push("cube--seen");
    }

    return classNames.join(" ");
}

function renderApp() {
    prepareCurrentWeek();
    renderHeader();
    updateTimer();

    if (gameState.currentView === "pokedex") {
        renderPokedex();
    } else {
        renderWeeklyGrid();
    }

    renderFooterButtons();
}

function renderHeader() {
    const activeLine = getActiveLine();
    const cubeCount = gameState.weekly.cubes.length;

    elements.activeLine.innerHTML = "";
    elements.progressCount.textContent = `${cubeCount} / ${TOTAL_CUBES}`;
    elements.progressBar.style.width = `${Math.min(100, (cubeCount / TOTAL_CUBES) * 100)}%`;

    if (!activeLine) {
        elements.activeLine.append(createEmptyCube());
        return;
    }

    // --- ÉTAPE 1 : Trouver l'index du premier Pokémon qui n'est pas encore obtenu ---
    const nextPokemonIndex = activeLine.evolutionLine.findIndex(
        (pokemonId) => !getPokemon(pokemonId).obtained
    );

    // --- ÉTAPE 2 : Générer les cubes et les flèches au bon endroit ---
    activeLine.evolutionLine.forEach((pokemonId, index) => {
        const pokemon = getPokemon(pokemonId);

        // Flèche AVANT le premier Pokémon de la lignée
        if (index === 0) {
            const startArrow = document.createElement("img");
            startArrow.className = "header__arrow"; // Unique classe de style

            // JavaScript choisit le bon fichier physique
            if (nextPokemonIndex === 0) {
                startArrow.src = "./assets/images/ico-arrow-active.svg";
            } else {
                startArrow.src = "./assets/images/ico-arrow.svg";
            }

            startArrow.alt = "Flèche";
            elements.activeLine.append(startArrow);
        }

        // Création du cube du Pokémon
        const cube = document.createElement("div");
        cube.className = getHeaderCubeClassName(pokemon);
        cube.style.setProperty(
            "--pokemon-image",
            `url("${getPokemonImagePath(pokemonId)}")`
        );
        elements.activeLine.append(cube);

        // Flèche APRÈS ce Pokémon (sauf si c'est le dernier)
        if (index < activeLine.evolutionLine.length - 1) {
            const arrow = document.createElement("img");
            arrow.className = "header__arrow"; // Unique classe de style

            // JavaScript choisit le bon fichier physique
            if (nextPokemonIndex === index + 1) {
                arrow.src = "./assets/images/ico-arrow-active.svg";
            } else {
                arrow.src = "./assets/images/ico-arrow.svg";
            }

            arrow.alt = "Flèche";
            elements.activeLine.append(arrow);
        }
    });
}

function renderWeeklyGrid() {
    elements.grid.className = gameState.isPlacingCubes ? "grid grid--placing card" : "grid card";
    elements.grid.innerHTML = "";

    for (let slotIndex = 0; slotIndex < TOTAL_CUBES; slotIndex += 1) {
        const committedCube = getCommittedCubeAt(slotIndex);
        const pendingCube = getPendingCubeAt(slotIndex);

        if (pendingCube) {
            elements.grid.append(createStampCube(pendingCube.pokemonId, ["cube--pending"], slotIndex));
        } else if (committedCube) {
            const modifiers = gameState.isPlacingCubes ? ["cube--committed"] : [];
            elements.grid.append(createStampCube(committedCube.pokemonId, modifiers, slotIndex));
        } else {
            elements.grid.append(createEmptyGridCube(slotIndex));
        }
    }
}

function renderPokedex() {
    elements.grid.className = "grid grid--pokedex card";
    elements.grid.innerHTML = "";

    gameState.pokemon.forEach((pokemon) => {
        const cube = createPokemonCube(pokemon.id, { tagName: "button" });

        cube.type = "button";
        cube.title = pokemon.obtained ? `Choisir ${pokemon.name}` : pokemon.name;

        if (pokemon.obtained) {
            cube.addEventListener("click", () => selectStamp(pokemon.id));
        } else {
            cube.classList.add("cube--locked");
            cube.disabled = true;
        }

        elements.grid.append(cube);
    });
}

function renderFooterButtons() {
    if (gameState.isPlacingCubes) {
        elements.addLabel.textContent = "Annuler";
        elements.viewLabel.textContent = "Confirmer";

        // On cache les deux images avec ta classe CSS
        elements.addIcon.classList.add("btn__image--hidden");
        elements.viewIcon.classList.add("btn__image--hidden");

        elements.addCube.disabled = false;
        elements.togglePokedex.disabled = false;
        return;
    }

    elements.addLabel.textContent = "Cubes";
    elements.viewLabel.textContent = gameState.currentView === "pokedex" ? "Grille" : "Pokédex";

    // En mode normal, on réaffiche les images en retirant la classe
    elements.addIcon.classList.remove("btn__image--hidden");
    elements.viewIcon.classList.remove("btn__image--hidden");

    elements.addCube.disabled = gameState.weekly.cubes.length >= TOTAL_CUBES || !getActiveLine();
    elements.togglePokedex.disabled = false;
}

function createPokemonCube(pokemonId, options = {}) {
    const pokemon = getPokemon(pokemonId);
    const cube = document.createElement(options.tagName ?? "div");

    cube.className = getCubeClassName(pokemon);
    cube.style.setProperty("--pokemon-image", `url("${getPokemonImagePath(pokemonId)}")`);
    cube.setAttribute("aria-label", pokemon.name);

    if (!pokemon.seen && !pokemon.obtained) {
        const number = document.createElement("span");
        number.className = "cube__number";
        number.textContent = String(pokemon.id).padStart(3, "0");
        cube.append(number);
    }

    return cube;
}

function createStampCube(pokemonId, modifiers = [], slotIndex) {
    const cube = document.createElement(gameState.isPlacingCubes ? "button" : "div");

    cube.className = ["cube", "cube--stamp", ...modifiers].join(" ");
    cube.style.setProperty("--pokemon-image", `url("${getPokemonImagePath(pokemonId)}")`);
    cube.setAttribute("aria-label", getPokemonName(pokemonId));

    if (gameState.isPlacingCubes && modifiers.includes("cube--pending")) {
        cube.type = "button";
        cube.addEventListener("click", () => placePendingCube(slotIndex));
    }

    return cube;
}

function createEmptyGridCube(slotIndex) {
    const cube = document.createElement(gameState.isPlacingCubes ? "button" : "div");

    cube.className = "cube";

    if (gameState.isPlacingCubes) {
        cube.type = "button";
        cube.setAttribute("aria-label", `Placer un cube en position ${slotIndex + 1}`);
        cube.addEventListener("click", () => placePendingCube(slotIndex));
    }

    return cube;
}

function createEmptyCube() {
    const cube = document.createElement("div");
    cube.className = "cube";

    return cube;
}

function getCubeClassName(pokemon) {
    const classNames = ["cube"];

    if (pokemon.obtained) {
        classNames.push("cube--obtained");
    } else if (pokemon.seen) {
        classNames.push("cube--seen");
    }

    if (pokemon.selected) {
        classNames.push("cube--selected");
    }

    return classNames.join(" ");
}

function updateTimer() {
    const currentWeekKey = getWeekKey(new Date());

    if (gameState.weekly.weekKey && gameState.weekly.weekKey !== currentWeekKey) {
        prepareCurrentWeek();
        renderApp();
        return;
    }

    elements.timer.textContent = formatRemainingTime(getNextWeekStart(new Date()) - new Date());
}

function formatRemainingTime(remainingTime) {
    const safeRemainingTime = Math.max(0, remainingTime);
    const days = Math.floor(safeRemainingTime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((safeRemainingTime / (60 * 60 * 1000)) % 24);
    const minutes = Math.floor((safeRemainingTime / (60 * 1000)) % 60);

    if (days > 0) {
        return `${days}j ${hours}h`;
    }

    return `${hours}h ${minutes}min`;
}

function getWeekKey(date) {
    const weekStart = getWeekStart(date);
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, "0");
    const day = String(weekStart.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getWeekStart(date) {
    const weekStart = new Date(date);
    const daysSinceMonday = (weekStart.getDay() + 6) % 7;

    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - daysSinceMonday);

    return weekStart;
}

function getNextWeekStart(date) {
    return new Date(getWeekStart(date).getTime() + WEEK_IN_MS);
}

function getThreshold(index, targetCount) {
    return Math.ceil(((index + 1) * TOTAL_CUBES) / targetCount);
}

function getTotalPlacedCubeCount() {
    return gameState.weekly.cubes.length + gameState.pendingCubes.length;
}

function getCommittedCubeAt(slotIndex) {
    return gameState.weekly.cubes.find((cube) => cube.slotIndex === slotIndex) ?? null;
}

function getPendingCubeAt(slotIndex) {
    return gameState.pendingCubes.find((cube) => cube.slotIndex === slotIndex) ?? null;
}

function getActiveLine() {
    return EVOLUTION_LINES.find((line) => line.baseId === gameState.weekly.activeLineBaseId) ?? null;
}

function isLineComplete(line) {
    return line.evolutionLine.every((pokemonId) => getPokemon(pokemonId).obtained);
}

function getMissingPokemonIds(line) {
    return line.evolutionLine.filter((pokemonId) => !getPokemon(pokemonId).obtained);
}

function getPokemon(pokemonId) {
    return gameState.pokemon[pokemonId - 1];
}

function getPokemonName(pokemonId) {
    return POKEMON_NAMES[pokemonId];
}

function getPokemonImagePath(pokemonId) {
    return `./assets/images/${String(pokemonId).padStart(3, "0")}.png`;
}

function saveGameState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createSaveData()));
}

function createSaveData() {
    // Structure proche d'une sauvegarde JSON exportable, sans les cubes temporaires.
    return {
        pokemon: gameState.pokemon,
        selectedPokemonId: gameState.selectedPokemonId,
        currentView: gameState.currentView,
        weekly: gameState.weekly,
    };
}

function resetGame() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
}

// On sauvegarde le lien de ta musique qui est défini dans ton HTML
const musicSrc = elements.backgroundMusic ? elements.backgroundMusic.src : "";
// Une variable pour retenir la seconde exacte où le joueur a quitté
let savedTime = 0;

document.addEventListener("visibilitychange", () => {
    if (!elements.backgroundMusic) return;

    if (document.hidden) {
        // 1. On sauvegarde l'endroit où la musique était rendue
        savedTime = elements.backgroundMusic.currentTime;
        // 2. On la met en pause
        elements.backgroundMusic.pause();
        // 3. On VIDE la source. Le widget Spotify disparaît INSTANTANÉMENT de l'écran verrouillé !
        elements.backgroundMusic.src = "";
    } else {
        // Le joueur est de retour sur l'application !
        if (musicHasStarted) {
            // 1. On remet la source d'origine
            elements.backgroundMusic.src = musicSrc;
            // 2. On force le rechargement du fichier
            elements.backgroundMusic.load();
            // 3. On replace le curseur là où le joueur était rendu
            elements.backgroundMusic.currentTime = savedTime;
            
            // 4. On relance la musique
            elements.backgroundMusic.play().catch((error) => {
                console.log("Le navigateur a bloqué la reprise automatique :", error);
            });
        }
    }
});

window.addEventListener("resize", () => {
    if (typeof renderGrid === "function") {
        renderGrid();
    }
});