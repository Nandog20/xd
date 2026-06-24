// LÓGICA DEL JUEGO - ESCAPIST HIGH: SAKURA CHRONICLE

// AUDIO MANAGER (Web Audio API)
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    
    // Resume context if suspended (browser security)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        switch (type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'success':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(450, now + 0.08);
                osc.frequency.setValueAtTime(600, now + 0.16);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.25);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
                break;
            case 'bell':
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.05, now);
                for (let i = 0; i < 4; i++) {
                    osc.frequency.setValueAtTime(784, now + i * 0.15); // Note G5
                    osc.frequency.setValueAtTime(880, now + i * 0.15 + 0.07); // Note A5
                }
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
                osc.start(now);
                osc.stop(now + 0.7);
                break;
            case 'combat_hit':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
                osc.start(now);
                osc.stop(now + 0.18);
                break;
            case 'combat_block':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            case 'victory':
                // Retro triumphant arpeggio
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C Major
                notes.forEach((freq, idx) => {
                    const noteTime = now + idx * 0.08;
                    const nOsc = audioCtx.createOscillator();
                    const nGain = audioCtx.createGain();
                    nOsc.connect(nGain);
                    nGain.connect(audioCtx.destination);
                    nOsc.type = 'sine';
                    nOsc.frequency.setValueAtTime(freq, noteTime);
                    nGain.gain.setValueAtTime(0.06, noteTime);
                    nGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);
                    nOsc.start(noteTime);
                    nOsc.stop(noteTime + 0.2);
                });
                break;
            case 'gameover':
                // Slow descension
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.8);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
                break;
        }
    } catch (e) {
        console.warn("Error sintetizando sonido:", e);
    }
}

// ITEMS DATABASE
const ITEMS = {
    // Materiales comunes
    'papel': { name: 'Papel', desc: 'Hojas en blanco arrancadas de un cuaderno. Material de crafteo.', icon: '📄', price: 50, contraband: false },
    'lapiz': { name: 'Lápiz', desc: 'Un lápiz común. Puede usarse para crafteo o para redactar notas rápidas.', icon: '✏️', price: 50, contraband: false },
    'clip': { name: 'Sujetapapeles', desc: 'Clip metálico. Combinado con un bobby pin, hace una ganzúa.', icon: '📎', price: 100, contraband: true },
    'bobby_pin': { name: 'Bobby Pin (Horquilla)', desc: 'Una horquilla para el pelo. Clave para el forzado de casilleros.', icon: '📌', price: 100, contraband: true },
    'regla': { name: 'Regla Metálica', desc: 'Una regla rígida de acero. Puede ser un arma letal improvisada.', icon: '📏', price: 200, contraband: true },
    'clavos': { name: 'Clavos Oxidados', desc: 'Clavos del cuarto de conserjería. Utilizados para armar reglas o bates.', icon: '🔩', price: 80, contraband: true },
    
    // Comestibles
    'bebida_vitaminas': { name: 'Soda de Vitaminas', desc: 'Bebida azucarada con cafeína. Restaura 15 de Energía.', icon: '🥤', price: 150, contraband: false, effect: { energy: 15, hp: 0, stress: -5 } },
    'cafe': { name: 'Café de Lata', desc: 'Café concentrado de máquina expendedora. Restaura 20 de Energía, pero sube +5 de Estrés.', icon: '☕', price: 200, contraband: false, effect: { energy: 20, hp: 0, stress: 5 } },
    'arroz': { name: 'Arroz de Kombini', desc: 'Paquete de arroz para microondas. Buen ingrediente para almuerzos.', icon: '🍙', price: 100, contraband: false },
    'salmon': { name: 'Salmón Fresco', desc: 'Una pieza de salmón empacado del kombini.', icon: '🐟', price: 300, contraband: false },
    
    // Crafteados & Especiales
    'apuntes_trampa': { name: 'Acordeón de Examen (Cheat Sheet)', desc: 'Notas de estudio milimétricas. Aumenta un 35% el éxito en exámenes. ¡Cuidado si te atrapan!', icon: '📝', price: 400, contraband: true },
    'regla_armada': { name: 'Regla Dentada', desc: 'Regla metálica con clavos adheridos. Añade +8 de Fuerza de ataque en combate.', icon: '🔪', price: 600, contraband: true, equipable: true, power: 8 },
    'bebida_energia': { name: 'Bebida Energizante Casera', desc: 'Mezcla hiperactiva de café y soda vitamínica. Restaura 50 de Energía y reduce 10 de Estrés.', icon: '🧪', price: 350, contraband: false, effect: { energy: 50, hp: 0, stress: -10 } },
    'bento_amor': { name: 'Bento de Amor casero', desc: 'Almuerzo cocinado con cariño. Cuando lo regalas a un estudiante, ganas +40 de opinión.', icon: '🍱', price: 500, contraband: false, effect: { energy: 30, hp: 10, stress: -20 } },
    'ganzua': { name: 'Ganzúa Improvisada', desc: 'Herramienta casera para forzar cerraduras. Se rompe tras su uso exitoso.', icon: '🔑', price: 300, contraband: true },
    'bate_madera': { name: 'Bate de Madera', desc: 'Un bate de béisbol reglamentario. Arma clásica de delincuente. Añade +15 de Fuerza de ataque.', icon: '🏏', price: 800, contraband: true, equipable: true, power: 15 },
    
    // Quest Items
    'diario_secreto': { name: 'Diario Íntimo', desc: 'Diario privado de Yuki con candado de corazones. ¿Quién querría leer esto?', icon: '📕', price: 1000, contraband: true }
};

// RECIPES DATABASE
const RECIPES = [
    { id: 'recipe_cheat_sheet', name: 'Acordeón de Examen', result: 'apuntes_trampa', req: { 'papel': 1, 'lapiz': 1 }, desc: 'Papel + Lápiz' },
    { id: 'recipe_spiked_ruler', name: 'Regla Dentada', result: 'regla_armada', req: { 'regla': 1, 'clavos': 1 }, desc: 'Regla Metálica + Clavos' },
    { id: 'recipe_energy_drink', name: 'Bebida Energizante', result: 'bebida_energia', req: { 'cafe': 1, 'bebida_vitaminas': 1 }, desc: 'Café de Lata + Soda de Vitaminas' },
    { id: 'recipe_love_bento', name: 'Bento de Amor', result: 'bento_amor', req: { 'arroz': 1, 'salmon': 1 }, desc: 'Arroz + Salmón' },
    { id: 'recipe_lockpick', name: 'Ganzúa Improvisada', result: 'ganzua', req: { 'clip': 1, 'bobby_pin': 1 }, desc: 'Sujetapapeles + Bobby Pin' }
];

// LOCATIONS DATA
const LOCATIONS = {
    'classroom': {
        name: 'Salón de Clases 2-B',
        desc: 'Tu salón natal. Aquí tomas clases y asistes al pase de lista de山田-sensei (Yamada). Hay 40 pupitres cargados de tesoros... o basura escolar.',
        icon: '🏫',
        actions: ['attend_class', 'loot_desks']
    },
    'library': {
        name: 'Biblioteca del Instituto',
        desc: 'Lugar silencioso custodiado por estanterías enormes. Ideal para estudiar duro o buscar documentos confidenciales.',
        icon: '📚',
        actions: ['study_library', 'loot_library']
    },
    'gym': {
        name: 'Gimnasio & Zona de Ejercicio',
        desc: 'Equipamiento deportivo, colchonetas y pesas. Aquí entrenan los clubes de atletismo. Excelente para subir de fuerza física.',
        icon: '💪',
        actions: ['train_gym', 'loot_gym']
    },
    'courtyard': {
        name: 'Patio de Cerezos',
        desc: 'Un precioso jardín lleno de pétalos de Sakura. Lugar de almuerzo para muchos alumnos y punto caliente de rumores sociales.',
        icon: '🌸',
        actions: ['socialize_courtyard', 'buy_vending']
    },
    'rooftop': {
        name: 'Azotea del Edificio',
        desc: 'Acceso restringido, pero la puerta suele estar abierta. Un rincón silencioso y privado. El lugar preferido para contrabandear o desestresarse sin miradas indiscretas.',
        icon: '🏢',
        actions: ['rest_rooftop', 'secret_deal']
    },
    'kombini': {
        name: 'Tienda Kombini (Afueras)',
        desc: 'Un pequeño supermercado abierto las 24 horas. Puedes comprar comida fresca, bebidas y componentes o trabajar a tiempo parcial.',
        icon: '🏪',
        actions: ['work_kombini', 'shop_kombini']
    },
    'home': {
        name: 'Tu Habitación / Hogar',
        desc: 'Tu refugio personal. Aquí duermes para finalizar el día. También puedes craftear con tranquilidad total o descansar para curarte.',
        icon: '🏠',
        actions: ['sleep_bed', 'rest_home']
    }
};

// DIARIOS Y HORARIOS
const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const SCHOOL_SCHEDULE = [
    { start: 8, end: 9, period: 'Pase de Lista', location: 'classroom', desc: '¡Pase de lista matutino con Yamada-sensei!' },
    { start: 9, end: 12, period: 'Clases de Mañana', location: 'classroom', desc: 'Matemáticas y Literatura Japonesa.' },
    { start: 12, end: 13, period: 'Almuerzo', location: 'courtyard', desc: 'Tiempo libre para comer y charlar.' },
    { start: 13, end: 15, period: 'Clases de Tarde', location: 'classroom', desc: 'Ciencias e Historia Mundial.' },
    { start: 15, end: 17, period: 'Actividades de Club', location: ['gym', 'library'], desc: 'Entrena o estudia en tu club respectivo.' },
    { start: 17, end: 20, period: 'Tiempo Libre', location: 'any', desc: 'Puedes salir, comerciar o trabajar.' },
    { start: 20, end: 22, period: 'Regresar a Casa', location: 'home', desc: 'Prepara el crafteo o relájate antes de dormir.' },
    { start: 22, end: 24, period: 'Toque de queda', location: 'home', desc: '¡Debes estar en cama ya!' }
];

const WEEKEND_SCHEDULE = [
    { start: 8, end: 22, period: 'Día Libre Fin de Semana', location: 'any', desc: 'Sin clases. Aprovecha para entrenar, trabajar y comerciar.' },
    { start: 22, end: 24, period: 'Toque de queda', location: 'home', desc: '¡Hora de dormir!' }
];

// STATE DEL JUEGO
const state = {
    // Stats de personaje
    player: {
        name: 'Ryu',
        club: 'deportes',
        hp: 100,
        maxHp: 100,
        energy: 100,
        maxEnergy: 100,
        stress: 0,
        heat: 0, // Suspicion
        money: 1500,
        
        strength: 10,
        strengthLvl: 1,
        intellect: 10,
        intellectLvl: 1,
        charisma: 10,
        charismaLvl: 1,
        
        equippedWeapon: null
    },
    
    // Tiempo
    currentDayIdx: 0, // 0 = Lunes, 6 = Domingo
    currentHour: 8,
    currentMinute: 0,
    
    // Ubicación
    currentLocation: 'classroom',
    
    // Inventario
    inventory: [],
    
    // Casilleros / escritorios saqueados hoy (se resetea al dormir)
    lootedToday: {},
    
    // Misiones
    quests: [],
    completedQuestsCount: 0,
    
    // NPCs
    npcs: {
        'yuki': { id: 'yuki', name: 'Yuki Sato', role: 'Presidenta de la Clase 2-B', avatar: '👓', opinion: 10, items: ['papel', 'lapiz', 'bebida_vitaminas'], defaultRoom: 'classroom', liked: ['apuntes_trampa', 'diario_secreto'], questChain: 0 },
        'kenji': { id: 'kenji', name: 'Kenji Tanaka', role: 'Delincuente Rebelde', avatar: '👊', opinion: -10, items: ['clavos', 'regla', 'bobby_pin', 'bate_madera'], defaultRoom: 'courtyard', liked: ['regla_armada', 'bebida_energia', 'bate_madera'], questChain: 0 },
        'yamada': { id: 'yamada', name: 'Yamada-sensei', role: 'Tutor Estricto', avatar: '👨‍🏫', opinion: 0, items: [], defaultRoom: 'classroom', liked: [], questChain: -1 }, // No vende nada
        'aiko': { id: 'aiko', name: 'Aiko Watanabe', role: 'Ídolo Escolar', avatar: '🌸', opinion: 15, items: ['bebida_vitaminas', 'bento_amor'], defaultRoom: 'courtyard', liked: ['bento_amor', 'diario_secreto'], questChain: 0 },
        'haruto': { id: 'haruto', name: 'Haruto Suzuki', role: 'Otaku de Ciencias', avatar: '🧪', opinion: 20, items: ['clip', 'bobby_pin', 'bebida_energia'], defaultRoom: 'library', liked: ['papel', 'lapiz'], questChain: 0 }
    },
    
    // Estado de combate activo
    combat: null
};

// CONFIGURACIONES INICIALES DE CLUB
const CLUB_BONUSES = {
    'deportes': { strength: 15, maxHp: 120, hp: 120, money: 800 },
    'ciencias': { intellect: 18, charisma: 5, money: 1200 },
    'teatro': { charisma: 18, strength: 5, money: 1500 },
    'delincuente': { strength: 12, stress: 0, money: 500, startingWeapon: 'bate_madera' }
};

// --- AL INICIAR LA PÁGINA ---
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    populateClubOptions();
    // Iniciar con sonido encendido
    document.getElementById('sfx-toggle').addEventListener('click', toggleSound);
});

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('sfx-toggle');
    if (soundEnabled) {
        btn.textContent = '🔊';
        btn.style.borderColor = 'var(--border-color)';
    } else {
        btn.textContent = '🔇';
        btn.style.borderColor = 'var(--neon-red)';
    }
}

function populateClubOptions() {
    const options = document.querySelectorAll('.club-option');
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            playSound('click');
        });
    });
}

function setupEventListeners() {
    // Start Game Button
    document.getElementById('start-game-btn').addEventListener('click', startGame);

    // Tab Navigation
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetTab = tab.getAttribute('data-tab');
            switchTab(targetTab, tab);
            playSound('click');
        });
    });

    // Clear Log button
    document.getElementById('clear-log').addEventListener('click', () => {
        document.getElementById('game-log').innerHTML = '';
        playSound('click');
    });

    // Close Dialog Modal
    document.getElementById('close-dialog').addEventListener('click', () => {
        document.getElementById('dialog-overlay').classList.remove('active');
        playSound('click');
    });

    // Restart game button
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        document.getElementById('results-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
        playSound('click');
    });

    // Combat buttons
    document.getElementById('combat-btn-strike').addEventListener('click', () => combatTurn('strike'));
    document.getElementById('combat-btn-taunt').addEventListener('click', () => combatTurn('taunt'));
    document.getElementById('combat-btn-heal').addEventListener('click', () => combatTurn('heal'));
    document.getElementById('combat-btn-flee').addEventListener('click', () => combatTurn('flee'));
}

function switchTab(tabId, tabButtonEl) {
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    const buttons = document.querySelectorAll('.tab-nav button, .tab-btn');
    buttons.forEach(b => b.classList.remove('active'));
    tabButtonEl.classList.add('active');

    if (tabId === 'tab-npcs') {
        renderNPCs();
    } else if (tabId === 'tab-inventory') {
        renderInventory();
        renderCrafting();
    } else if (tabId === 'tab-quests') {
        renderQuests();
    } else if (tabId === 'tab-location') {
        renderLocationDetails();
    }
}

// --- COMUNICACIÓN Y ACCIONES DEL LOG ---
function logMessage(text, type = 'system') {
    const logContainer = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const timeStr = `[${String(state.currentHour).padStart(2, '0')}:${String(state.currentMinute).padStart(2, '0')}] `;
    entry.textContent = timeStr + text;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// --- INICIO DEL JUEGO ---
function startGame() {
    const nameInput = document.getElementById('player-name').value.trim();
    state.player.name = nameInput || 'Ryu';
    
    // Get Selected Club
    const selectedClubEl = document.querySelector('.club-option.active');
    const clubId = selectedClubEl ? selectedClubEl.getAttribute('data-club') : 'deportes';
    state.player.club = clubId;

    // Reset base game state
    state.player.hp = 100;
    state.player.maxHp = 100;
    state.player.energy = 100;
    state.player.maxEnergy = 100;
    state.player.stress = 0;
    state.player.heat = 0;
    state.player.money = 1500;
    state.player.strength = 10;
    state.player.strengthLvl = 1;
    state.player.intellect = 10;
    state.player.intellectLvl = 1;
    state.player.charisma = 10;
    state.player.charismaLvl = 1;
    state.player.equippedWeapon = null;
    
    state.inventory = [];
    state.quests = [];
    state.completedQuestsCount = 0;
    state.lootedToday = {};
    state.currentDayIdx = 0; // Lunes
    state.currentHour = 8;
    state.currentMinute = 0;
    state.currentLocation = 'classroom';

    // Apply Club Bonuses
    const bonus = CLUB_BONUSES[clubId];
    if (bonus) {
        if (bonus.strength) state.player.strength = bonus.strength;
        if (bonus.intellect) state.player.intellect = bonus.intellect;
        if (bonus.charisma) state.player.charisma = bonus.charisma;
        if (bonus.maxHp) {
            state.player.maxHp = bonus.maxHp;
            state.player.hp = bonus.maxHp;
        }
        if (bonus.money) state.player.money = bonus.money;
        if (bonus.startingWeapon) {
            state.inventory.push(bonus.startingWeapon);
            state.player.equippedWeapon = bonus.startingWeapon;
        }
    }

    // Set Level display based on starting attributes
    state.player.strengthLvl = Math.floor(state.player.strength / 10);
    state.player.intellectLvl = Math.floor(state.player.intellect / 10);
    state.player.charismaLvl = Math.floor(state.player.charisma / 10);

    // Initial Quests Setup
    state.quests = [
        { id: 'quest_tutorial_1', title: 'Rutina Diaria', desc: 'Asiste al Pase de Lista a las 08:00 en el Salón 2-B hoy.', type: 'schedule', targetLoc: 'classroom', targetPeriod: 'Pase de Lista', reward: 300, finished: false }
    ];

    // Transition Screens
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');

    // Reset opinion values
    state.npcs.yuki.opinion = 10;
    state.npcs.kenji.opinion = -10;
    state.npcs.yamada.opinion = 0;
    state.npcs.aiko.opinion = 15;
    state.npcs.haruto.opinion = 20;

    initAudio();
    playSound('success');

    logMessage(`¡Aventura escolar iniciada! Bienvenido/a, ${state.player.name}. Club actual: ${selectedClubEl.querySelector('h3').textContent}.`, 'success');
    logMessage('🔊 Suena el timbre matutino. Yamada-sensei está entrando para pasar de lista en el Salón 2-B.', 'bell');

    updateHUD();
    renderSchedule();
    renderLocationDetails();
}

// --- ACTUALIZACIONES HUD ---
function updateHUD() {
    // Visual indicators
    document.getElementById('display-day').textContent = WEEKDAYS[state.currentDayIdx];
    document.getElementById('display-time').textContent = `${String(state.currentHour).padStart(2, '0')}:${String(state.currentMinute).padStart(2, '0')}`;
    
    const schedulePeriod = getSchedulePeriod();
    document.getElementById('display-period').textContent = schedulePeriod.period;
    document.getElementById('display-location').textContent = LOCATIONS[state.currentLocation].name;

    // Status bars
    document.getElementById('val-hp').textContent = `${state.player.hp}/${state.player.maxHp}`;
    document.getElementById('bar-hp').style.width = `${(state.player.hp / state.player.maxHp) * 100}%`;

    document.getElementById('val-energy').textContent = `${state.player.energy}/${state.player.maxEnergy}`;
    document.getElementById('bar-energy').style.width = `${(state.player.energy / state.player.maxEnergy) * 100}%`;

    document.getElementById('val-stress').textContent = `${state.player.stress}/100`;
    document.getElementById('bar-stress').style.width = `${state.player.stress}%`;

    document.getElementById('val-heat').textContent = `${state.player.heat}/100`;
    document.getElementById('bar-heat').style.width = `${state.player.heat}%`;
    
    // Money
    document.getElementById('val-money').textContent = `¥${state.player.money.toLocaleString()}`;

    // Detailed statistics
    document.getElementById('val-strength-lvl').textContent = `Nivel ${state.player.strengthLvl}`;
    document.getElementById('val-strength-num').textContent = `${state.player.strength}/100`;
    document.getElementById('bar-strength-xp').style.width = `${state.player.strength % 10 * 10}%`;

    document.getElementById('val-intellect-lvl').textContent = `Nivel ${state.player.intellectLvl}`;
    document.getElementById('val-intellect-num').textContent = `${state.player.intellect}/100`;
    document.getElementById('bar-intellect-xp').style.width = `${state.player.intellect % 10 * 10}%`;

    document.getElementById('val-charisma-lvl').textContent = `Nivel ${state.player.charismaLvl}`;
    document.getElementById('val-charisma-num').textContent = `${state.player.charisma}/100`;
    document.getElementById('bar-charisma-xp').style.width = `${state.player.charisma % 10 * 10}%`;

    // Quests badge
    const activeQuests = state.quests.filter(q => !q.finished).length;
    document.getElementById('quest-count').textContent = activeQuests;

    // Heat Danger Check (100 = Detención/Game Over)
    if (state.player.heat >= 100) {
        triggerGameOver("¡El comité de disciplina y Yamada-sensei te atraparon rompiendo las reglas con contrabando en la escuela!");
    }
}

// --- CHEQUEO DE HORARIO ACTIVO ---
function getSchedulePeriod() {
    const isWeekend = (state.currentDayIdx === 5 || state.currentDayIdx === 6);
    const timeline = isWeekend ? WEEKEND_SCHEDULE : SCHOOL_SCHEDULE;
    const hour = state.currentHour;
    
    for (let period of timeline) {
        if (hour >= period.start && hour < period.end) {
            return period;
        }
    }
    return timeline[timeline.length - 1]; // Toque de queda
}

function renderSchedule() {
    const listEl = document.getElementById('schedule-list');
    listEl.innerHTML = '';
    
    const isWeekend = (state.currentDayIdx === 5 || state.currentDayIdx === 6);
    const timeline = isWeekend ? WEEKEND_SCHEDULE : SCHOOL_SCHEDULE;
    const currentPeriod = getSchedulePeriod();

    timeline.forEach(p => {
        const item = document.createElement('div');
        item.className = 'schedule-item';
        if (p.period === currentPeriod.period) {
            item.className += ' active';
        }
        
        let locName = 'Cualquiera';
        if (p.location !== 'any') {
            if (Array.isArray(p.location)) {
                locName = p.location.map(l => LOCATIONS[l].name.split(' ')[0]).join('/');
            } else {
                locName = LOCATIONS[p.location].name;
            }
        }

        item.innerHTML = `
            <span class="schedule-time">${String(p.start).padStart(2, '0')}:00</span>
            <div style="flex-grow: 1; margin-left: 10px;">
                <span class="schedule-activity">${p.period}</span>
                <span class="schedule-loc">(${locName})</span>
            </div>
        `;
        listEl.appendChild(item);
    });
}

// --- SISTEMA DE TIEMPO Y DESPLAZAMIENTO ---
function travel(locationId) {
    if (state.currentLocation === locationId) return;
    
    state.currentLocation = locationId;
    logMessage(`Te has trasladado a: ${LOCATIONS[locationId].name}.`, 'system');
    
    // Travel costs 10 mins and adds small stress
    advanceTime(10);
    state.player.stress = Math.min(100, state.player.stress + 1);
    
    playSound('click');
    updateHUD();
    renderSchedule();
    renderLocationDetails();
}

function advanceTime(minutes) {
    const oldPeriod = getSchedulePeriod();
    
    state.currentMinute += minutes;
    if (state.currentMinute >= 60) {
        state.currentHour += Math.floor(state.currentMinute / 60);
        state.currentMinute = state.currentMinute % 60;
    }
    
    const newPeriod = getSchedulePeriod();

    // Check Quests triggers
    checkQuestsProgress();

    // Check if period has changed
    if (oldPeriod.period !== newPeriod.period) {
        playSound('bell');
        logMessage(`🔔 ¡El timbre suena! Comienza el periodo: "${newPeriod.period}". Razón: ${newPeriod.desc}`, 'bell');
        
        // Discipline Check: If we missed an obligatory schedule activity
        checkScheduleAdherence(oldPeriod);
        renderSchedule();
    }

    // Force sleep if it hits 22:00 curfew
    if (state.currentHour >= 22) {
        logMessage(`⚠️ Son las ${state.currentHour}:00. Es el toque de queda. Eres forzado a regresar a tu habitación para dormir.`, 'warning');
        state.currentLocation = 'home';
        forceSleep();
    }
}

function checkScheduleAdherence(period) {
    if (period.location === 'any' || state.currentDayIdx >= 5) return; // Weekends or free times have no penalties

    let locationsList = Array.isArray(period.location) ? period.location : [period.location];
    
    if (!locationsList.includes(state.currentLocation)) {
        // Player skipped classes / roll call!
        const heatGain = 15;
        state.player.heat = Math.min(100, state.player.heat + heatGain);
        logMessage(`🚨 Te saltaste la actividad obligatoria "${period.period}". Yamada-sensei notó tu ausencia. (+${heatGain} de Calor / Sospecha)`, 'danger');
        updateHUD();
    }
}

function forceSleep() {
    logMessage(`💤 Te acuestas en tu cama y te quedas dormido plácidamente...`, 'system');
    
    // Sleeping restores status
    state.player.hp = state.player.maxHp;
    state.player.energy = state.player.maxEnergy;
    state.player.stress = 0;
    state.player.heat = Math.max(0, state.player.heat - 15); // Heat cools down overnight
    
    // Advance Day
    state.currentDayIdx++;
    state.currentHour = 8;
    state.currentMinute = 0;
    state.lootedToday = {}; // Reset looted desks container
    
    // Reset NPC positions if necessary
    
    if (state.currentDayIdx >= 7) {
        // End of week simulation loop
        state.currentDayIdx = 0;
        logMessage(`📆 ¡Ha comenzado una nueva semana escolar!`, 'success');
    }

    // Every Friday is exam day
    if (state.currentDayIdx === 4) {
        logMessage(`📝 ¡Hoy es viernes! Día de exámenes finales. Asegúrate de repasar o preparar una estrategia en el salón.`, 'warning');
    }

    // If day is weekend
    if (state.currentDayIdx === 5 || state.currentDayIdx === 6) {
        logMessage(`🎉 ¡Es fin de semana! No hay clases. Disfruta de libertad total de movimiento y entrena duro.`, 'success');
    }

    logMessage(`📅 Despiertas el día ${WEEKDAYS[state.currentDayIdx]} a las 08:00 AM.`, 'system');
    playSound('victory');
    
    updateHUD();
    renderSchedule();
    renderLocationDetails();
}

// --- ACCIONES CONTEXTUALES DE LA ZONA ---
function renderLocationDetails() {
    const loc = LOCATIONS[state.currentLocation];
    document.getElementById('location-name').textContent = loc.name;
    document.getElementById('location-desc').textContent = loc.desc;

    // Action buttons
    const actionContainer = document.getElementById('location-action-buttons');
    actionContainer.innerHTML = '';

    loc.actions.forEach(actId => {
        const btn = document.createElement('div');
        btn.className = 'act-card';
        
        let title = '';
        let desc = '';
        let costText = '';
        let energyCost = 0;
        
        switch (actId) {
            case 'attend_class':
                title = '📝 Asistir a Clase / Lista';
                desc = 'Cumple con el deber escolar. Reduce Calor en 10, consume 10 de Energía y otorga +2 de Inteligencia XP.';
                costText = '⚡ 10 | 🕐 60m';
                energyCost = 10;
                btn.addEventListener('click', () => performLocationAction('attend_class', energyCost, 60));
                break;
            case 'loot_desks':
                title = '🔍 Saquear Pupitres y Casilleros';
                desc = 'Busca contrabando en la clase. Consume 15 de Energía y sube +5 de Calor (Sospecha). ¡Puede dar materiales raros!';
                costText = '⚡ 15 | 🕐 10m';
                energyCost = 15;
                btn.addEventListener('click', () => performLocationAction('loot_desks', energyCost, 10));
                break;
            case 'study_library':
                title = '📖 Estudiar con Concentración';
                desc = 'Lee libros académicos. Aumenta Inteligencia (+8 XP) a cambio de 15 de Energía y +10 de Estrés.';
                costText = '⚡ 15 | 🕐 30m';
                energyCost = 15;
                btn.addEventListener('click', () => performLocationAction('study_library', energyCost, 30));
                break;
            case 'loot_library':
                title = '🔒 Forzar Casillero de Profesores';
                desc = 'Busca contrabandos premium o copias de examen. Requiere una Ganzúa. (+15 Calor)';
                costText = '⚡ 20 | 🕐 10m';
                energyCost = 20;
                btn.addEventListener('click', () => performLocationAction('loot_library', energyCost, 10));
                break;
            case 'train_gym':
                title = '🏃 Rutina de Ejercicio Físico';
                desc = 'Usa pesas y corre en la cinta. Sube Fuerza (+8 XP). Consume 20 de Energía y añade +10 de Estrés.';
                costText = '⚡ 20 | 🕐 30m';
                energyCost = 20;
                btn.addEventListener('click', () => performLocationAction('train_gym', energyCost, 30));
                break;
            case 'loot_gym':
                title = '🧹 Saquear Casilleros del Gimnasio';
                desc = 'Revisa las taquillas deportivas de tus compañeros. (+8 Calor)';
                costText = '⚡ 15 | 🕐 10m';
                energyCost = 15;
                btn.addEventListener('click', () => performLocationAction('loot_gym', energyCost, 10));
                break;
            case 'socialize_courtyard':
                title = '🗣️ Socializar y Cotillear';
                desc = 'Habla con otros alumnos y lee revistas de moda. Sube Carisma (+8 XP) a cambio de 15 de Energía.';
                costText = '⚡ 15 | 🕐 30m';
                energyCost = 15;
                btn.addEventListener('click', () => performLocationAction('socialize_courtyard', energyCost, 30));
                break;
            case 'buy_vending':
                title = '🥤 Comprar en Máquina Expendedora';
                desc = 'Adquiere una Soda de Vitaminas fresca por ¥150 para recuperar energía rápidamente.';
                costText = '¥150 | 🕐 5m';
                btn.addEventListener('click', () => performLocationAction('buy_vending', 0, 5));
                break;
            case 'rest_rooftop':
                title = '🚬 Descansar a Escondidas';
                desc = 'Relájate contemplando las nubes. Reduce 20 de Estrés y restaura 15 de Energía. 15% de probabilidad de que te pille Yamada-sensei.';
                costText = '⚡ 0 | 🕐 30m';
                btn.addEventListener('click', () => performLocationAction('rest_rooftop', 0, 30));
                break;
            case 'secret_deal':
                title = '🤝 Hacer Tratos con Delincuentes';
                desc = 'Los pandilleros se reúnen aquí. Aumenta Carisma y permite comerciar contrabandos especializados.';
                costText = '⚡ 10 | 🕐 15m';
                energyCost = 10;
                btn.addEventListener('click', () => performLocationAction('secret_deal', energyCost, 15));
                break;
            case 'work_kombini':
                title = '💴 Turno de Trabajo Parcial';
                desc = 'Trabaja como cajero en el kombini. Gana ¥1,500 (+¥100 por cada nivel de Carisma) a costa de 25 de Energía y +15 de Estrés.';
                costText = '⚡ 25 | 🕐 60m';
                energyCost = 25;
                btn.addEventListener('click', () => performLocationAction('work_kombini', energyCost, 60));
                break;
            case 'shop_kombini':
                title = '🛒 Comprar Víveres y Materiales';
                desc = 'Habla con el tendero para comprar suministros como Arroz, Salmón o Café.';
                costText = 'Gratis | 🕐 5m';
                btn.addEventListener('click', () => performLocationAction('shop_kombini', 0, 5));
                break;
            case 'sleep_bed':
                title = '💤 Dormir (Terminar Día)';
                desc = 'Termina tus actividades del día. Restaura salud, energía, cura el estrés y reduce tu nivel de Calor sospechoso.';
                costText = 'Dormir hasta Mañana';
                btn.addEventListener('click', () => performLocationAction('sleep_bed', 0, 0));
                break;
            case 'rest_home':
                title = '🏠 Estudiar o Descansar en Casa';
                desc = 'Repasa con apuntes o descansa seguro. Restaura 20 de Energía y reduce 10 de Estrés.';
                costText = '⚡ 0 | 🕐 40m';
                btn.addEventListener('click', () => performLocationAction('rest_home', 0, 40));
                break;
        }

        btn.innerHTML = `
            <div class="act-header">
                <span class="act-title">${title}</span>
                <span class="act-cost">${costText}</span>
            </div>
            <p class="act-desc">${desc}</p>
        `;
        
        // Disabled styling if not enough energy
        if (state.player.energy < energyCost) {
            btn.className += ' disabled';
        }

        actionContainer.appendChild(btn);
    });

    // Travel / Movement grid
    const travelContainer = document.getElementById('travel-buttons');
    travelContainer.innerHTML = '';

    Object.keys(LOCATIONS).forEach(locId => {
        const travelBtn = document.createElement('button');
        travelBtn.className = 'travel-btn';
        if (locId === state.currentLocation) {
            travelBtn.className += ' current';
            travelBtn.disabled = true;
        }

        travelBtn.innerHTML = `
            <span>${LOCATIONS[locId].icon}</span>
            <span>${LOCATIONS[locId].name.split(' ')[0]}</span>
        `;
        
        if (locId !== state.currentLocation) {
            travelBtn.addEventListener('click', () => travel(locId));
        }

        travelContainer.appendChild(travelBtn);
    });
}

function performLocationAction(actionType, energyCost, timeCost) {
    if (state.player.energy < energyCost) {
        logMessage("❌ No tienes suficiente Energía para realizar esta acción. ¡Debes descansar o comer!", "danger");
        playSound('error');
        return;
    }

    state.player.energy -= energyCost;
    
    switch (actionType) {
        case 'attend_class':
            state.player.heat = Math.max(0, state.player.heat - 10);
            gainXP('intellect', 3);
            logMessage(`Asististe a clases diligentemente. Prestaste atención a山田-sensei. (-10 Calor, +3 Inteligencia XP)`, 'success');
            break;
            
        case 'loot_desks':
            // Check daily limit of desks looted in this room
            const desksKey = `${state.currentLocation}_desks`;
            const lootTimes = state.lootedToday[desksKey] || 0;
            if (lootTimes >= 3) {
                logMessage(`❌ Todos los pupitres de esta zona ya han sido saqueados hoy. Busca en otra parte o espera a mañana.`, 'warning');
                state.player.energy += energyCost; // Reembolsar energía
                playSound('error');
                return;
            }
            state.lootedToday[desksKey] = lootTimes + 1;
            
            // Heat / detection risk
            state.player.heat = Math.min(100, state.player.heat + 8);
            
            // Loot outcome
            const itemsPool = ['papel', 'lapiz', 'clip', 'bobby_pin', 'arroz', 'cafe'];
            const foundItem = itemsPool[Math.floor(Math.random() * itemsPool.length)];
            
            if (state.inventory.length < 12) {
                state.inventory.push(foundItem);
                logMessage(`🔍 Rebuscaste entre los pupitres y encontraste: ${ITEMS[foundItem].icon} ${ITEMS[foundItem].name}. (+8 Calor)`, 'gain');
                playSound('success');
            } else {
                logMessage(`🔍 Encontraste ${ITEMS[foundItem].name}, pero tus bolsillos están llenos. ¡Tira algo antes!`, 'warning');
            }
            break;

        case 'study_library':
            gainXP('intellect', 8);
            state.player.stress = Math.min(100, state.player.stress + 8);
            logMessage(`Pasaste media hora leyendo libros gruesos sobre historia en la biblioteca. (+8 Inteligencia XP, +8 Estrés)`, 'gain');
            playSound('success');
            break;

        case 'loot_library':
            // Requires lockpick
            const hasLockpick = state.inventory.indexOf('ganzua') !== -1;
            if (!hasLockpick) {
                logMessage(`❌ Necesitas una Ganzúa Improvisada para abrir la taquilla privada de los maestros. Puedes craftearla en la pestaña de Inventario.`, 'danger');
                state.player.energy += energyCost;
                playSound('error');
                return;
            }
            
            // Consume lockpick
            state.inventory.splice(state.inventory.indexOf('ganzua'), 1);
            state.player.heat = Math.min(100, state.player.heat + 20);
            
            const rareItems = ['diario_secreto', 'bate_madera', 'salmon'];
            const foundRare = rareItems[Math.floor(Math.random() * rareItems.length)];
            
            if (state.inventory.length < 12) {
                state.inventory.push(foundRare);
                logMessage(`🔓 ¡Abriste con éxito el casillero restringido! Obtuviste: ${ITEMS[foundRare].icon} ${ITEMS[foundRare].name}. (+20 Calor)`, 'gain');
                playSound('victory');
            } else {
                logMessage(`🔓 Abriste el casillero y viste ${ITEMS[foundRare].name}, pero tu inventario está lleno.`, 'warning');
            }
            break;

        case 'train_gym':
            gainXP('strength', 8);
            state.player.stress = Math.min(100, state.player.stress + 10);
            logMessage(`Entrenaste duro en el Gimnasio levantando mancuernas. Te sientes más robusto. (+8 Fuerza XP, +10 Estrés)`, 'gain');
            playSound('success');
            break;

        case 'loot_gym':
            const gymLootKey = 'gym_desks';
            const gymLootTimes = state.lootedToday[gymLootKey] || 0;
            if (gymLootTimes >= 2) {
                logMessage(`❌ Los casilleros del gimnasio ya fueron vaciados por hoy.`, 'warning');
                state.player.energy += energyCost;
                playSound('error');
                return;
            }
            state.lootedToday[gymLootKey] = gymLootTimes + 1;
            state.player.heat = Math.min(100, state.player.heat + 10);
            
            const gymItems = ['clavos', 'regla', 'bebida_vitaminas', 'bobby_pin'];
            const foundGymItem = gymItems[Math.floor(Math.random() * gymItems.length)];
            if (state.inventory.length < 12) {
                state.inventory.push(foundGymItem);
                logMessage(`🔍 Abriste una taquilla metálica del vestuario: ¡Obtuviste ${ITEMS[foundGymItem].icon} ${ITEMS[foundGymItem].name}! (+10 Calor)`, 'gain');
                playSound('success');
            } else {
                logMessage(`🔍 Encontraste ${ITEMS[foundGymItem].name}, pero tus bolsillos están llenos.`, 'warning');
            }
            break;

        case 'socialize_courtyard':
            gainXP('charisma', 8);
            logMessage(`Charlaste con varios grupos de estudiantes bajo las flores de cerezo. Hablaste de modas y chismes escolares. (+8 Carisma XP)`, 'gain');
            playSound('success');
            break;

        case 'buy_vending':
            if (state.player.money < 150) {
                logMessage(`❌ No tienes suficientes Yenes (¥150) para comprar una soda.`, 'danger');
                playSound('error');
                return;
            }
            state.player.money -= 150;
            if (state.inventory.length < 12) {
                state.inventory.push('bebida_vitaminas');
                logMessage(`🥤 Depositaste ¥150 y retiraste una Soda de Vitaminas de la máquina expendedora.`, 'gain');
                playSound('success');
            } else {
                logMessage(`🥤 Compraste la Soda, pero se te cayó al suelo porque no tienes espacio en el inventario.`, 'warning');
            }
            break;

        case 'rest_rooftop':
            // Check teacher patrol chance
            const caught = Math.random() < 0.15;
            state.player.stress = Math.max(0, state.player.stress - 20);
            state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + 15);
            
            if (caught) {
                state.player.heat = Math.min(100, state.player.heat + 15);
                logMessage(`🚬 Relajación interrumpida: Yamada-sensei abrió la azotea de patrulla y te llamó la atención. (-20 Estrés, +15 Calor)`, 'warning');
                playSound('error');
            } else {
                logMessage(`☁️ Descansaste sintiendo el viento en la azotea del instituto. Te sientes renovado. (-20 Estrés, +15 Energía)`, 'success');
                playSound('success');
            }
            break;

        case 'secret_deal':
            gainXP('charisma', 4);
            logMessage(`Hablaste en voz baja con los rufianes en la azotea. Te enseñaron trucos del bajo mundo escolar. (+4 Carisma XP)`, 'gain');
            // Abre pestaña NPCs
            setTimeout(() => {
                const npcTabBtn = document.querySelector('[data-tab="tab-npcs"]');
                if (npcTabBtn) npcTabBtn.click();
            }, 500);
            break;

        case 'work_kombini':
            const salary = 1500 + (state.player.charismaLvl * 100);
            state.player.money += salary;
            state.player.stress = Math.min(100, state.player.stress + 15);
            logMessage(`Trabajaste un turno en la tienda de conveniencia. Atendiste clientes educadamente. ¡Ganaste ¥${salary}! (+15 Estrés)`, 'success');
            playSound('victory');
            break;

        case 'shop_kombini':
            openShopDialogue();
            break;

        case 'sleep_bed':
            forceSleep();
            return; // No sumar tiempo de acción normal
            
        case 'rest_home':
            state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + 20);
            state.player.stress = Math.max(0, state.player.stress - 10);
            logMessage(`Te relajaste en casa leyendo manga. (-10 Estrés, +20 Energía)`, 'success');
            playSound('success');
            break;
    }

    advanceTime(timeCost);
    updateHUD();
    renderLocationDetails();
}

function gainXP(stat, amount) {
    state.player[stat] += amount;
    
    // Check level up (every 10 XP points is a level)
    const newLvl = Math.floor(state.player[stat] / 10);
    const oldLvl = state.player[`${stat}Lvl`];
    
    if (newLvl > oldLvl) {
        state.player[`${stat}Lvl`] = newLvl;
        logMessage(`✨ ¡Nivel de estadística aumentado! Tu estadística de ${stat.toUpperCase()} ha subido al Nivel ${newLvl}.`, 'success');
        playSound('victory');
        
        // If Strength raises level, increase max HP
        if (stat === 'strength') {
            state.player.maxHp += 10;
            state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
        }
    }
}

// --- SISTEMA DE NPCs (INTERACCIÓN / COMERCIO) ---
function renderNPCs() {
    const listEl = document.getElementById('npc-list');
    listEl.innerHTML = '';

    Object.keys(state.npcs).forEach(id => {
        const npc = state.npcs[id];
        
        // Check if NPC is in current room or present
        // (For gameplay comfort, we allow talking to teachers at classroom and others in current zones)
        // Teachers are at class. Kenji is in gym/courtyard/rooftop. Yuki in classroom/library.
        
        const card = document.createElement('div');
        card.className = 'npc-card';
        
        // Opinion rating category class
        let opinionClass = 'opinion-neutral';
        if (npc.opinion > 25) opinionClass = 'opinion-positive';
        else if (npc.opinion < -15) opinionClass = 'opinion-negative';

        // Calculate Opinion width: opinion is -100 to 100. Let's map it to 0-100%
        const barWidth = ((npc.opinion + 100) / 200) * 100;

        card.innerHTML = `
            <div class="npc-card-header">
                <div class="npc-avatar-box">${npc.avatar}</div>
                <div>
                    <h4 class="npc-name">${npc.name}</h4>
                    <span class="npc-role">${npc.role}</span>
                </div>
            </div>
            
            <div class="npc-opinion-container">
                <div class="npc-opinion-label">
                    <span>Opinión</span>
                    <span>${npc.opinion > 0 ? '+' : ''}${npc.opinion}</span>
                </div>
                <div class="bar-opinion-bg">
                    <div class="bar-opinion ${opinionClass}" style="width: ${barWidth}%;"></div>
                </div>
            </div>

            <div class="npc-actions">
                <button class="btn btn-neutral btn-small" onclick="interactNPC('${npc.id}', 'talk')">🗣️ Hablar</button>
                <button class="btn btn-neutral btn-small" onclick="interactNPC('${npc.id}', 'flatter')">✨ Halagar</button>
                <button class="btn btn-neutral btn-small" onclick="interactNPC('${npc.id}', 'gift')">🎁 Regalar</button>
                <button class="btn btn-neutral btn-small" onclick="interactNPC('${npc.id}', 'trade')">🤝 Comerciar</button>
                <button class="btn btn-danger btn-small" onclick="interactNPC('${npc.id}', 'fight')">👊 Pelear</button>
                <button class="btn btn-warning btn-small" onclick="interactNPC('${npc.id}', 'quest')">📜 Misión</button>
            </div>
        `;
        listEl.appendChild(card);
    });
}

function interactNPC(npcId, action) {
    playSound('click');
    const npc = state.npcs[npcId];
    
    // Open Dialog Overlay
    const modal = document.getElementById('dialog-overlay');
    const dAvatar = document.getElementById('dialog-npc-avatar');
    const dName = document.getElementById('dialog-npc-name');
    const dRole = document.getElementById('dialog-npc-role');
    const dText = document.getElementById('dialog-text');
    const dActions = document.getElementById('dialog-actions-container');
    const tradeSec = document.getElementById('trade-interface');

    // Default settings
    dAvatar.textContent = npc.avatar;
    dName.textContent = npc.name;
    dRole.textContent = npc.role;
    tradeSec.classList.add('hidden');
    dActions.innerHTML = '';
    
    modal.classList.add('active');

    // Run custom action logic
    switch (action) {
        case 'talk':
            runTalkLogic(npc, dText, dActions);
            break;
        case 'flatter':
            runFlatterLogic(npc, dText, dActions);
            break;
        case 'gift':
            runGiftLogic(npc, dText, dActions);
            break;
        case 'trade':
            runTradeLogic(npc, dText, dActions, tradeSec);
            break;
        case 'fight':
            modal.classList.remove('active'); // Cerrar este diálogo
            startCombat(npcId);
            break;
        case 'quest':
            runQuestLogic(npc, dText, dActions);
            break;
    }
}

// NPC - HABLAR / COTILLEAR
function runTalkLogic(npc, dText, dActions) {
    let response = '';
    let opinionChange = 0;

    if (npc.id === 'yuki') {
        if (npc.opinion > 40) {
            response = `"¡Hola, Ryu! Me alegra ver que te esfuerzas tanto en clases. Ten cuidado con Kenji, estuvo planeando algo sospechoso en el patio."`;
            opinionChange = 2;
        } else {
            response = `"¿Hola? Intenta estudiar más, Ryu. Las calificaciones del examen del viernes se registrarán en tu expediente permanente."`;
            opinionChange = 1;
        }
    } else if (npc.id === 'kenji') {
        if (npc.opinion > 20) {
            response = `"Vaya, pero si eres tú. Escuché que andas buscando una ganzúa. Si consigues un clip y una horquilla, combínalos en tus bolsillos y podrás abrir los casilleros de los maestros."`;
            opinionChange = 2;
        } else {
            response = `"¿Qué quieres? Quítate de mi vista si no tienes dinero o contrabando para comerciar."`;
            opinionChange = -1;
        }
    } else if (npc.id === 'yamada') {
        response = `"Estudiante, el tiempo en este instituto es oro. Asegúrate de estar en el Gimnasio en las actividades de club o estudiando."`;
    } else if (npc.id === 'aiko') {
        response = `"¡Hola! El clima está precioso hoy, ¿verdad? Me encantan los Bento caseros de Arroz y Salmón que venden en la tienda..." (Pista: Receta de Bento de amor)`;
        opinionChange = 2;
    } else if (npc.id === 'haruto') {
        response = `"Hola, Ryu. Estoy programando un microcontrolador y me he quedado sin clips metálicos para hacer puentes electrónicos..."`;
        opinionChange = 2;
    }

    npc.opinion = Math.min(100, Math.max(-100, npc.opinion + opinionChange));
    dText.textContent = response;

    // Action buttons inside modal
    dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Entendido</button>`;
    
    if (opinionChange > 0) {
        logMessage(`Charlaste con ${npc.name}. Su opinión subió un poco. (+${opinionChange} Opinión)`, 'success');
    }
    updateHUD();
}

// NPC - HALAGAR (Persuasion roll)
function runFlatterLogic(npc, dText, dActions) {
    // success probability is based on Charisma stat vs NPC multiplier
    const successChance = Math.min(0.95, 0.35 + (state.player.charismaLvl * 0.05));
    const roll = Math.random();

    let response = '';
    let opinionChange = 0;

    if (roll < successChance) {
        // Success
        opinionChange = Math.floor(Math.random() * 8) + 5;
        playSound('success');
        if (npc.id === 'yamada') {
            response = `"Hmm... Aprecio tu respeto y reconocimiento hacia mi labor docente. Sigue así."`;
        } else {
            response = `"¡Oh, qué amable de tu parte decir eso! De verdad me halagas bastante..."`;
        }
    } else {
        // Fail
        opinionChange = -Math.floor(Math.random() * 6) - 5;
        playSound('error');
        if (npc.id === 'yamada') {
            response = `"¿Intentas adularme para evitar tus responsabilidades? Cero tolerancia. Vuelve a tus tareas."`;
        } else {
            response = `"Eww... Eso sonó extremadamente falso e incómodo. Déjame en paz..."`;
        }
    }

    npc.opinion = Math.min(100, Math.max(-100, npc.opinion + opinionChange));
    dText.textContent = response;
    dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Aceptar</button>`;

    if (opinionChange > 0) {
        logMessage(`Halagaste a ${npc.name} con éxito. (+${opinionChange} Opinión)`, 'success');
    } else {
        logMessage(`Halagaste a ${npc.name} de forma incómoda. (${opinionChange} Opinión)`, 'warning');
    }

    updateHUD();
}

// NPC - REGALAR
function runGiftLogic(npc, dText, dActions) {
    dText.textContent = "Selecciona un objeto de tus bolsillos para regalarle. Cada persona tiene gustos únicos y reaccionará de distinta forma.";

    // Render player items that can be gifted
    let giftContainer = document.createElement('div');
    giftContainer.className = 'shop-grid';
    giftContainer.style.marginTop = '15px';

    if (state.inventory.length === 0) {
        giftContainer.innerHTML = `<p style="grid-column: span 4; color: var(--text-muted); font-size: 0.85rem;">No tienes ningún objeto en tu inventario para regalar.</p>`;
    } else {
        state.inventory.forEach((itemId, idx) => {
            const item = ITEMS[itemId];
            const itemBtn = document.createElement('div');
            itemBtn.className = 'shop-item';
            itemBtn.innerHTML = `<span>${item.icon}</span>`;
            itemBtn.setAttribute('data-price', item.name.split(' ')[0]);
            
            itemBtn.addEventListener('click', () => {
                giftItemToNPC(npc, itemId, idx);
            });
            giftContainer.appendChild(itemBtn);
        });
    }

    // Append to dialog body temporarily
    const dBody = document.querySelector('.dialog-body');
    // Remove old sub-grids
    const oldGrid = dBody.querySelector('.shop-grid');
    if (oldGrid) oldGrid.remove();
    dBody.appendChild(giftContainer);

    dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Cancelar</button>`;
}

function giftItemToNPC(npc, itemId, itemIdx) {
    playSound('success');
    
    // Remove from inventory
    state.inventory.splice(itemIdx, 1);
    
    // Calculate opinion gain
    const item = ITEMS[itemId];
    let opinionGain = 10; // Base gain

    // Check custom likes
    if (npc.liked.includes(itemId)) {
        opinionGain = 35; // Loved item!
        if (itemId === 'bento_amor') opinionGain = 45;
    } else if (item.contraband && npc.id === 'yamada') {
        opinionGain = -40; // Giving contraband to a teacher is disastrous!
        state.player.heat = Math.min(100, state.player.heat + 25);
    } else if (item.contraband && npc.id !== 'kenji') {
        opinionGain = -10; // Common students get scared of contraband
    }

    npc.opinion = Math.min(100, Math.max(-100, npc.opinion + opinionGain));
    
    const dText = document.getElementById('dialog-text');
    let responseText = '';

    if (opinionGain >= 35) {
        responseText = `"¡INCREÍBLE! ¿De verdad esto es para mí? ¡Muchísimas gracias! Llevaba mucho tiempo deseando tener algo así."`;
        logMessage(`Le regalaste ${item.name} a ${npc.name}. ¡Le encantó! (+${opinionGain} Opinión)`, 'success');
    } else if (opinionGain < 0) {
        if (npc.id === 'yamada') {
            responseText = `"¿Pretendes sobornarme con contrabando escolar prohibido? Confisco este artículo inmediatamente y reporto tu conducta."`;
            logMessage(`¡Le diste contrabando a Yamada-sensei! Confiscó el artículo y subió tu Calor (+25 Calor, -40 Opinión).`, 'danger');
        } else {
            responseText = `"Ehh... ¿Por qué me estás dando este objeto tan sospechoso? Qué miedo, de verdad..."`;
            logMessage(`Le diste un objeto inadecuado a ${npc.name}. (${opinionGain} Opinión)`, 'warning');
        }
    } else {
        responseText = `"Oh, gracias. Es un detalle muy amable de tu parte."`;
        logMessage(`Le regalaste ${item.name} a ${npc.name}. (+${opinionGain} Opinión)`, 'success');
    }

    dText.textContent = responseText;
    
    // Clear the gift grid from dialog body
    const dBody = document.querySelector('.dialog-body');
    const oldGrid = dBody.querySelector('.shop-grid');
    if (oldGrid) oldGrid.remove();

    document.getElementById('dialog-actions-container').innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Cerrar</button>`;
    
    updateHUD();
}

// NPC - COMERCIO (Trade)
function runTradeLogic(npc, dText, dActions, tradeSec) {
    if (npc.id === 'yamada') {
        dText.textContent = `"¿Comerciar? Soy un docente respetable en este recinto. No fomento el mercado informal en la academia."`;
        dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Entendido</button>`;
        return;
    }

    dText.textContent = `"Echa un vistazo a lo que tengo. Cada artículo cuesta un precio justo en yenes. Haz clic para comprar."`;
    tradeSec.classList.remove('hidden');

    const npcShopGrid = document.getElementById('npc-shop-grid');
    npcShopGrid.innerHTML = '';

    // Populate NPC shop items
    npc.items.forEach(itemId => {
        const item = ITEMS[itemId];
        // Discount based on Charisma level and NPC opinion
        const discountFactor = Math.min(0.3, (state.player.charismaLvl * 0.02) + (npc.opinion > 0 ? npc.opinion * 0.002 : 0));
        const finalPrice = Math.max(10, Math.floor(item.price * (1 - discountFactor)));

        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `<span>${item.icon}</span>`;
        shopItem.setAttribute('data-price', `¥${finalPrice}`);
        shopItem.title = `${item.name}: ${item.desc}`;

        shopItem.addEventListener('click', () => {
            buyItemFromNPC(npc, itemId, finalPrice);
        });

        npcShopGrid.appendChild(shopItem);
    });

    dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Terminar Trato</button>`;
}

function buyItemFromNPC(npc, itemId, price) {
    if (state.player.money < price) {
        logMessage(`❌ No tienes suficiente dinero (¥${price}) para comprar este artículo.`, 'danger');
        playSound('error');
        return;
    }
    if (state.inventory.length >= 12) {
        logMessage(`❌ Bolsillos llenos. No puedes llevar más cosas en tu inventario.`, 'warning');
        playSound('error');
        return;
    }

    state.player.money -= price;
    state.inventory.push(itemId);
    playSound('success');

    logMessage(`Compraste ${ITEMS[itemId].name} de ${npc.name} por ¥${price}.`, 'gain');
    updateHUD();

    // Re-render trade tab details to refresh items/money
    const tradeSec = document.getElementById('trade-interface');
    const dActions = document.getElementById('dialog-actions-container');
    const dText = document.getElementById('dialog-text');
    runTradeLogic(npc, dText, dActions, tradeSec);
}

// TIERRA EXPENDEDORA & KOMBINI TIENDA ADICIONALES
function openShopDialogue() {
    playSound('click');
    const npcDummy = {
        name: 'Tendero Kombini',
        role: 'Vendedor Local',
        avatar: '🏪',
        opinion: 0,
        items: ['bebida_vitaminas', 'cafe', 'arroz', 'salmon', 'bobby_pin']
    };
    
    // Open Dialog
    const modal = document.getElementById('dialog-overlay');
    const dAvatar = document.getElementById('dialog-npc-avatar');
    const dName = document.getElementById('dialog-npc-name');
    const dRole = document.getElementById('dialog-npc-role');
    const dText = document.getElementById('dialog-text');
    const dActions = document.getElementById('dialog-actions-container');
    const tradeSec = document.getElementById('trade-interface');

    dAvatar.textContent = npcDummy.avatar;
    dName.textContent = npcDummy.name;
    dRole.textContent = npcDummy.role;
    dText.textContent = `"Bienvenido al Kombini local. Ofrecemos comestibles de calidad para estudiantes."`;
    tradeSec.classList.remove('hidden');

    const npcShopGrid = document.getElementById('npc-shop-grid');
    npcShopGrid.innerHTML = '';

    npcDummy.items.forEach(itemId => {
        const item = ITEMS[itemId];
        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';
        shopItem.innerHTML = `<span>${item.icon}</span>`;
        shopItem.setAttribute('data-price', `¥${item.price}`);
        shopItem.title = `${item.name}: ${item.desc}`;

        shopItem.addEventListener('click', () => {
            buyItemFromNPC(npcDummy, itemId, item.price);
        });

        npcShopGrid.appendChild(shopItem);
    });

    dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Salir</button>`;
    modal.classList.add('active');
}

// NPC - MISIONES (Quests request)
function runQuestLogic(npc, dText, dActions) {
    // Check if NPC has available quests based on player level
    // We generated 3 quest archetypes
    
    let activeNpcQuest = state.quests.find(q => q.giver === npc.id && !q.finished);
    
    if (activeNpcQuest) {
        dText.textContent = `"¿Cómo vas con mi encargo: '${activeNpcQuest.title}'? Aún estoy esperando que lo termines."`;
        dActions.innerHTML = `<button class="btn btn-neutral" onclick="document.getElementById('dialog-overlay').classList.remove('active')">Continuar</button>`;
        return;
    }

    // Check if we can offer a new quest
    let newQuest = null;
    
    if (npc.id === 'yuki' && npc.questChain === 0) {
        newQuest = {
            id: 'quest_yuki_1',
            title: 'Reposo Académico',
            desc: 'Consigue y entrégale una Bebida de Vitaminas para aliviar sus dolores de cabeza por el estrés del consejo estudiantil.',
            type: 'give_item',
            itemNeeded: 'bebida_vitaminas',
            giver: 'yuki',
            reward: 400,
            finished: false
        };
    } else if (npc.id === 'kenji' && npc.questChain === 0) {
        newQuest = {
            id: 'quest_kenji_1',
            title: 'Contrabando Rápido',
            desc: 'Trae 2 Sujetapapeles (clips) a Kenji para su red de ganzúas.',
            type: 'collect_items',
            itemNeeded: 'clip',
            qtyNeeded: 2,
            giver: 'kenji',
            reward: 600,
            finished: false
        };
    } else if (npc.id === 'aiko' && npc.questChain === 0) {
        newQuest = {
            id: 'quest_aiko_1',
            title: 'Almuerzo de Ensueño',
            desc: 'Craftea y regálale un Bento de Amor fresco a Aiko Watanabe.',
            type: 'give_item',
            itemNeeded: 'bento_amor',
            giver: 'aiko',
            reward: 700,
            finished: false
        };
    } else if (npc.id === 'haruto' && npc.questChain === 0) {
        newQuest = {
            id: 'quest_haruto_1',
            title: 'Vandalismo Escrito',
            desc: 'Yamada-sensei le confiscó un boceto. Consigue un Lápiz y dale una lección de fuerza a Kenji (Derrótalo en combate).',
            type: 'combat_defeat',
            targetNpc: 'kenji',
            giver: 'haruto',
            reward: 800,
            finished: false
        };
    }

    if (newQuest) {
        dText.textContent = `"${npc.name} tiene una tarea para ti: '${newQuest.title}'. ¿Aceptas ayudar?"`;
        
        const acceptBtn = document.createElement('button');
        acceptBtn.className = 'btn btn-primary';
        acceptBtn.textContent = 'Aceptar Misión';
        acceptBtn.addEventListener('click', () => {
            state.quests.push(newQuest);
            logMessage(`Misión aceptada: "${newQuest.title}" de ${npc.name}.`, 'success');
            playSound('success');
            document.getElementById('dialog-overlay').classList.remove('active');
            updateHUD();
        });
        
        dActions.appendChild(acceptBtn);
    } else {
        dText.textContent = `"Por el momento no necesito ninguna ayuda extra, Ryu. ¡Pero gracias por preguntar!"`;
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-neutral';
    cancelBtn.textContent = 'Salir';
    cancelBtn.addEventListener('click', () => {
        document.getElementById('dialog-overlay').classList.remove('active');
    });
    dActions.appendChild(cancelBtn);
}

// --- CHEQUEAR Y COMPLETAR MISIONES ---
function checkQuestsProgress() {
    state.quests.forEach(q => {
        if (q.finished) return;

        // Type: Schedule
        if (q.type === 'schedule') {
            const currentPeriod = getSchedulePeriod();
            if (state.currentLocation === q.targetLoc && currentPeriod.period === q.targetPeriod) {
                completeQuest(q);
            }
        }
        
        // Type: Give Item
        if (q.type === 'give_item') {
            const itemIdx = state.inventory.indexOf(q.itemNeeded);
            if (itemIdx !== -1 && state.currentLocation === state.npcs[q.giver].defaultRoom) {
                // If player approaches the giver with the item, trigger dialog completion
                // (Done automatically or manually inside dialog, here let's auto-trigger when nearby as a comfort feature)
            }
        }
    });

    // Check if it is Friday (Day Index 4) and 09:00 AM (Class Time)
    if (state.currentDayIdx === 4 && state.currentHour === 9 && state.currentMinute === 0) {
        triggerExamEvent();
    }
}

function completeQuest(quest) {
    quest.finished = true;
    state.player.money += quest.reward;
    state.completedQuestsCount++;
    
    // Add reputation/opinion points
    if (quest.giver && state.npcs[quest.giver]) {
        state.npcs[quest.giver].opinion = Math.min(100, state.npcs[quest.giver].opinion + 20);
        state.npcs[quest.giver].questChain++;
    }

    logMessage(`🎉 ¡Misión completada: "${quest.title}"! Recompensa: +¥${quest.reward}. Opinión del dador aumentada.`, 'success');
    playSound('victory');
    
    updateHUD();
    renderQuests();
}

// --- RENDERIZADO DE MISIONES TAB ---
function renderQuests() {
    const listEl = document.getElementById('quests-list');
    listEl.innerHTML = '';
    
    const activeQuests = state.quests.filter(q => !q.finished);

    if (activeQuests.length === 0) {
        listEl.innerHTML = `<p class="no-quests">No tienes misiones activas. Habla con Yuki, Kenji o Aiko en los pasillos.</p>`;
        return;
    }

    activeQuests.forEach(q => {
        const item = document.createElement('div');
        item.className = 'quest-item';
        
        let progressText = 'En progreso';
        let actionBtnHTML = '';

        // Context complete buttons inside quest tracker
        if (q.type === 'give_item') {
            const hasItem = state.inventory.includes(q.itemNeeded);
            progressText = hasItem ? '✅ Listo para entregar' : `Buscar: ${ITEMS[q.itemNeeded].name}`;
            
            if (hasItem) {
                actionBtnHTML = `<button class="btn btn-success btn-small" onclick="deliverQuestItem('${q.id}')">Entregar</button>`;
            }
        } else if (q.type === 'collect_items') {
            const count = state.inventory.filter(i => i === q.itemNeeded).length;
            progressText = `Progreso: ${count}/${q.qtyNeeded} ${ITEMS[q.itemNeeded].name}`;
            
            if (count >= q.qtyNeeded) {
                actionBtnHTML = `<button class="btn btn-success btn-small" onclick="deliverQuestCollect('${q.id}')">Entregar</button>`;
            }
        } else if (q.type === 'combat_defeat') {
            progressText = `Derrotar a: ${state.npcs[q.targetNpc].name}`;
        }

        item.innerHTML = `
            <div class="quest-details">
                <span class="quest-title">${q.title}</span>
                <p class="quest-desc">${q.desc}</p>
                <div class="quest-meta">
                    <span class="quest-reward">💰 Recompensa: ¥${q.reward}</span>
                    <span class="quest-giver">👤 Dador: ${state.npcs[q.giver].name}</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                <span class="quest-progress">${progressText}</span>
                ${actionBtnHTML}
            </div>
        `;
        listEl.appendChild(item);
    });
}

function deliverQuestItem(questId) {
    const qIndex = state.quests.findIndex(q => q.id === questId);
    if (qIndex === -1) return;
    const quest = state.quests[qIndex];
    
    // Remove item
    const itemIdx = state.inventory.indexOf(quest.itemNeeded);
    if (itemIdx !== -1) {
        state.inventory.splice(itemIdx, 1);
        completeQuest(quest);
    }
}

function deliverQuestCollect(questId) {
    const qIndex = state.quests.findIndex(q => q.id === questId);
    if (qIndex === -1) return;
    const quest = state.quests[qIndex];
    
    // Remove required quantity
    let removed = 0;
    while (removed < quest.qtyNeeded) {
        const itemIdx = state.inventory.indexOf(quest.itemNeeded);
        if (itemIdx !== -1) {
            state.inventory.splice(itemIdx, 1);
            removed++;
        } else {
            break;
        }
    }
    completeQuest(quest);
}

// --- RENDER DE INVENTARIO Y CRAFTEO ---
let selectedSlotIdx = null;

function renderInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    
    document.getElementById('inv-slots-used').textContent = state.inventory.length;

    // We have 12 inventory slots
    for (let i = 0; i < 12; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        
        if (i < state.inventory.length) {
            const itemId = state.inventory[i];
            const item = ITEMS[itemId];
            slot.textContent = item.icon;
            slot.title = item.name;
            
            if (item.contraband) {
                slot.className += ' contraband';
            }
            if (state.player.equippedWeapon === itemId && i === state.inventory.indexOf(itemId)) {
                // Ensure only one of same item is marked equipped
                slot.className += ' equipped';
            }

            if (selectedSlotIdx === i) {
                slot.className += ' active';
            }

            slot.addEventListener('click', () => {
                selectedSlotIdx = i;
                showItemDetails(itemId, i);
                renderInventory();
                playSound('click');
            });
        } else {
            // Empty slot
            slot.innerHTML = '';
            slot.addEventListener('click', () => {
                selectedSlotIdx = null;
                document.getElementById('item-details-box').classList.add('hidden');
                renderInventory();
                playSound('click');
            });
        }

        grid.appendChild(slot);
    }
}

function showItemDetails(itemId, index) {
    const box = document.getElementById('item-details-box');
    box.classList.remove('hidden');
    
    const item = ITEMS[itemId];
    document.getElementById('detail-item-name').textContent = `${item.icon} ${item.name} ${item.contraband ? '🔥 (Contrabando)' : ''}`;
    document.getElementById('detail-item-desc').textContent = item.desc;

    const useBtn = document.getElementById('btn-use-item');
    const discardBtn = document.getElementById('btn-discard-item');

    // Rename button based on item action type (Use vs Equip)
    if (item.equipable) {
        const isEquipped = state.player.equippedWeapon === itemId;
        useBtn.textContent = isEquipped ? 'Desequipar' : 'Equipar';
    } else if (item.effect) {
        useBtn.textContent = 'Usar / Consumir';
    } else {
        useBtn.textContent = 'No Utilizable';
    }

    // Remove old listeners
    useBtn.replaceWith(useBtn.cloneNode(true));
    discardBtn.replaceWith(discardBtn.cloneNode(true));

    const newUseBtn = document.getElementById('btn-use-item');
    const newDiscardBtn = document.getElementById('btn-discard-item');

    if (item.effect || item.equipable) {
        newUseBtn.disabled = false;
        newUseBtn.addEventListener('click', () => useInventoryItem(itemId, index));
    } else {
        newUseBtn.disabled = true;
    }

    newDiscardBtn.addEventListener('click', () => discardInventoryItem(index));
}

function useInventoryItem(itemId, index) {
    const item = ITEMS[itemId];
    
    if (item.effect) {
        // Apply consumable stats
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + (item.effect.hp || 0));
        state.player.energy = Math.min(state.player.maxEnergy, state.player.energy + (item.effect.energy || 0));
        state.player.stress = Math.max(0, state.player.stress + (item.effect.stress || 0));
        
        logMessage(`Consumiste ${item.name}. HP: +${item.effect.hp || 0}, Energía: +${item.effect.energy || 0}, Estrés: ${item.effect.stress || 0}`, 'success');
        playSound('success');
        
        // Remove from inventory
        state.inventory.splice(index, 1);
        selectedSlotIdx = null;
        document.getElementById('item-details-box').classList.add('hidden');
    } else if (item.equipable) {
        // Toggle Equip weapon
        if (state.player.equippedWeapon === itemId) {
            state.player.equippedWeapon = null;
            logMessage(`Desequipaste: ${item.name}.`, 'system');
        } else {
            state.player.equippedWeapon = itemId;
            logMessage(`Equipaste como arma activa: ${item.name} (+${item.power} Daño).`, 'success');
        }
        playSound('success');
    }

    updateHUD();
    renderInventory();
}

function discardInventoryItem(index) {
    const itemId = state.inventory[index];
    
    // Unequip if discarded
    if (state.player.equippedWeapon === itemId) {
        state.player.equippedWeapon = null;
    }

    state.inventory.splice(index, 1);
    selectedSlotIdx = null;
    document.getElementById('item-details-box').classList.add('hidden');
    
    logMessage(`Tiraste ${ITEMS[itemId].name} al suelo.`, 'warning');
    playSound('error');
    
    updateHUD();
    renderInventory();
}

function renderCrafting() {
    const listEl = document.getElementById('crafting-list');
    listEl.innerHTML = '';

    RECIPES.forEach(recipe => {
        const item = ITEMS[recipe.result];
        
        // Check if player has required items
        let canCraft = true;
        const missing = [];

        Object.keys(recipe.req).forEach(reqId => {
            const requiredQty = recipe.req[reqId];
            const playerQty = state.inventory.filter(i => i === reqId).length;
            if (playerQty < requiredQty) {
                canCraft = false;
                missing.push(`${ITEMS[reqId].name} (${playerQty}/${requiredQty})`);
            }
        });

        const card = document.createElement('div');
        card.className = `craft-recipe ${canCraft ? 'can-craft' : ''}`;
        
        const craftBtnHTML = canCraft 
            ? `<button class="btn btn-primary btn-small" onclick="craftItem('${recipe.id}')">Craftear</button>`
            : `<button class="btn btn-neutral btn-small" disabled>Faltan Items</button>`;

        const recipeNotes = Object.keys(recipe.req)
            .map(reqId => `${ITEMS[reqId].icon} ${ITEMS[reqId].name} (x${recipe.req[reqId]})`)
            .join(' + ');

        card.innerHTML = `
            <div class="recipe-info">
                <span class="recipe-name">${item.icon} ${recipe.name}</span>
                <span class="recipe-ingredients">${recipeNotes}</span>
            </div>
            <div>
                ${craftBtnHTML}
            </div>
        `;
        listEl.appendChild(card);
    });
}

function craftItem(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return;

    // Deduct items from inventory
    Object.keys(recipe.req).forEach(reqId => {
        const qty = recipe.req[reqId];
        for (let i = 0; i < qty; i++) {
            const index = state.inventory.indexOf(reqId);
            if (index !== -1) {
                state.inventory.splice(index, 1);
            }
        }
    });

    // Add crafteado result
    state.inventory.push(recipe.result);
    playSound('victory');
    
    logMessage(`🛠️ ¡Crafteaste con éxito: ${ITEMS[recipe.result].icon} ${recipe.name}!`, 'success');
    
    updateHUD();
    renderInventory();
    renderCrafting();
}

// --- SISTEMA DE COMBATE (The Escapists Turn Combat) ---
function startCombat(npcId) {
    const npc = state.npcs[npcId];
    playSound('error'); // Tension alarm
    
    state.combat = {
        enemyId: npcId,
        enemyHp: 80 + (npc.opinion < -30 ? 40 : 0) + (npcId === 'kenji' ? 40 : 0), // Delinquents have more health
        enemyMaxHp: 80 + (npc.opinion < -30 ? 40 : 0) + (npcId === 'kenji' ? 40 : 0),
        enemyEnergy: 100,
        playerHp: state.player.hp,
        playerMaxHp: state.player.maxHp
    };

    // Update overlay details
    document.getElementById('combat-enemy-name').textContent = `${npc.name} (${npc.role})`;
    document.getElementById('combat-enemy-avatar').textContent = npc.avatar;
    document.getElementById('combat-player-name').textContent = `${state.player.name} (${state.player.club.toUpperCase()})`;

    const weaponName = state.player.equippedWeapon ? ITEMS[state.player.equippedWeapon].name : 'Puños';
    document.getElementById('combat-player-weapon').textContent = `Arma: ${weaponName}`;

    // Show Overlay
    document.getElementById('combat-overlay').classList.add('active');
    
    const logBox = document.getElementById('combat-log');
    logBox.innerHTML = `<p>⚔️ Has desafiado a una pelea a ${npc.name}. ¡Los pasillos guardan silencio!</p>`;

    updateCombatUI();
}

function updateCombatUI() {
    const c = state.combat;
    
    // Player HP
    document.getElementById('combat-player-hp-val').textContent = `${c.playerHp}/${c.playerMaxHp} HP`;
    document.getElementById('combat-player-hp-bar').style.width = `${(c.playerHp / c.playerMaxHp) * 100}%`;
    
    // Enemy HP
    document.getElementById('combat-enemy-hp-val').textContent = `${c.enemyHp}/${c.enemyMaxHp} HP`;
    document.getElementById('combat-enemy-hp-bar').style.width = `${(c.enemyHp / c.enemyMaxHp) * 100}%`;
}

function combatTurn(playerAction) {
    const c = state.combat;
    if (!c) return;

    const logBox = document.getElementById('combat-log');
    const npc = state.npcs[c.enemyId];
    let playerDamage = 0;
    
    // PLAYER TURN
    if (playerAction === 'strike') {
        playSound('combat_hit');
        // Calculate player damage: Strength Level + weapon power
        let baseDmg = 5 + Math.floor(state.player.strengthLvl * 1.5);
        if (state.player.equippedWeapon) {
            baseDmg += ITEMS[state.player.equippedWeapon].power || 0;
        }
        // Critical hit check
        const isCrit = Math.random() < 0.15;
        playerDamage = Math.floor(baseDmg * (isCrit ? 1.8 : 1));
        c.enemyHp = Math.max(0, c.enemyHp - playerDamage);
        
        logBox.innerHTML += `<p style="color: #fff">👊 Golpeaste a ${npc.name} causando <strong style="color: var(--neon-red);">${playerDamage}</strong> de daño${isCrit ? ' (¡CRÍTICO!)' : ''}.</p>`;
    } 
    else if (playerAction === 'taunt') {
        playSound('combat_block');
        // Deduct enemy accuracy/energy
        c.enemyEnergy = Math.max(0, c.enemyEnergy - 30);
        logBox.innerHTML += `<p style="color: var(--neon-yellow)">🗣️ Provocaste a ${npc.name}, reduciendo su concentración. Su próximo ataque será más débil.</p>`;
    } 
    else if (playerAction === 'heal') {
        // Use bento or energy drink if present in inventory
        const healItemIdx = state.inventory.findIndex(i => i === 'bebida_energia' || i === 'bebida_vitaminas' || i === 'bento_amor');
        if (healItemIdx === -1) {
            playSound('error');
            logBox.innerHTML += `<p style="color: var(--neon-orange)">❌ ¡No tienes consumibles curativos en tus bolsillos!</p>`;
            return;
        }
        
        const itemId = state.inventory[healItemIdx];
        const item = ITEMS[itemId];
        state.inventory.splice(healItemIdx, 1); // Consumed
        playSound('success');

        let hpHealed = 25;
        if (itemId === 'bento_amor') hpHealed = 45;
        c.playerHp = Math.min(c.playerMaxHp, c.playerHp + hpHealed);

        logBox.innerHTML += `<p style="color: var(--neon-green)">🧪 Consumiste ${item.name} y te curaste <strong style="color: var(--neon-green);">${hpHealed} HP</strong>.</p>`;
        
        renderInventory(); // Update inventory slot visual
    } 
    else if (playerAction === 'flee') {
        // Escape check based on Intellect / Charisma speed
        const escapeChance = 0.35 + (state.player.intellectLvl * 0.05);
        if (Math.random() < escapeChance) {
            playSound('success');
            logMessage(`Escapaste con éxito del combate contra ${npc.name}.`, 'warning');
            state.player.hp = c.playerHp; // Preserve HP changes
            state.player.stress = Math.min(100, state.player.stress + 10);
            state.player.heat = Math.min(100, state.player.heat + 12);
            document.getElementById('combat-overlay').classList.remove('active');
            state.combat = null;
            updateHUD();
            return;
        } else {
            playSound('error');
            logBox.innerHTML += `<p style="color: var(--neon-orange)">🏃 Intentaste huir, pero ${npc.name} te bloqueó el paso.</p>`;
        }
    }

    updateCombatUI();

    // Check if Enemy Defeated
    if (c.enemyHp <= 0) {
        endCombat(true);
        return;
    }

    // ENEMY TURN (Basic AI)
    setTimeout(() => {
        if (!state.combat) return; // In case player escaped
        
        // Enemy attacks
        playSound('combat_hit');
        let enemyBaseDmg = 6;
        if (npc.id === 'kenji') enemyBaseDmg = 12; // Delinquent hits harder
        if (npc.id === 'yamada') enemyBaseDmg = 15; // Teachers are dangerous!
        
        // Apply concentration taunt debuff
        if (c.enemyEnergy < 100) {
            enemyBaseDmg = Math.floor(enemyBaseDmg * 0.5);
            c.enemyEnergy = 100; // Reset debuff
        }

        const enemyDmg = Math.floor(enemyBaseDmg * (0.8 + Math.random() * 0.4));
        c.playerHp = Math.max(0, c.playerHp - enemyDmg);
        logBox.innerHTML += `<p style="color: var(--neon-red)">💥 ${npc.name} te atacó y te causó <strong>${enemyDmg}</strong> de daño.</p>`;
        logBox.scrollTop = logBox.scrollHeight;
        
        updateCombatUI();

        // Check Player Defeated
        if (c.playerHp <= 0) {
            endCombat(false);
        }
    }, 800);
}

function endCombat(playerWon) {
    const c = state.combat;
    const npc = state.npcs[c.enemyId];
    
    state.player.hp = c.playerHp; // Apply health change to state
    document.getElementById('combat-overlay').classList.remove('active');
    
    if (playerWon) {
        playSound('victory');
        logMessage(`💥 ¡Ganaste la pelea contra ${npc.name}!`, 'success');
        
        // Loot reward (stole Yen or materials)
        const yenStolen = Math.floor(Math.random() * 400) + 200;
        state.player.money += yenStolen;
        npc.opinion = Math.max(-100, npc.opinion - 30);
        
        // Heat level up due to fighting
        state.player.heat = Math.min(100, state.player.heat + 20);
        
        logMessage(`Robaste ¥${yenStolen} de sus bolsillos. Tu Calor aumentó (+20 Calor, -30 Opinión).`, 'gain');
        
        // Check quest defeat conditions
        state.quests.forEach(q => {
            if (q.type === 'combat_defeat' && q.targetNpc === c.enemyId && !q.finished) {
                completeQuest(q);
            }
        });
    } else {
        playSound('gameover');
        logMessage(`🤕 Fuiste noqueado en combate por ${npc.name}...`, 'danger');
        
        // Send to Nurse office: Lose energy, raise heat, lose some money
        state.currentLocation = 'home';
        state.player.hp = Math.floor(state.player.maxHp * 0.5); // Starts with half health
        state.player.energy = 30;
        state.player.stress = Math.min(100, state.player.stress + 30);
        state.player.heat = Math.min(100, state.player.heat + 25); // Caught by teachers
        
        const loss = Math.floor(state.player.money * 0.2);
        state.player.money -= loss;
        
        logMessage(`Despiertas en la enfermería con dolor de cabeza. Te confiscaron ¥${loss} para gastos médicos. (+25 Calor, +30 Estrés)`, 'danger');
    }

    state.combat = null;
    updateHUD();
    renderLocationDetails();
}

// --- CHEQUEO DE EVENTOS FINALES / EXAMEN (Friday Event) ---
// (Procesado dentro de la función combinada checkQuestsProgress en la sección anterior)

function triggerExamEvent() {
    playSound('error');
    const modal = document.getElementById('event-overlay');
    const title = document.getElementById('event-modal-title');
    const desc = document.getElementById('event-modal-desc');
    const optionsContainer = document.getElementById('event-modal-options');

    title.textContent = "📝 ¡Examen Semestral de la Academia!";
    desc.textContent = `Yamada-sensei reparte las hojas del examen final. Toda la clase está en silencio. Tu nivel de Inteligencia es de Nivel ${state.player.intellectLvl}. El éxito en este examen define tu futuro en la academia. ¿Cómo procederás?`;
    
    optionsContainer.innerHTML = '';
    modal.classList.add('active');

    // Option 1: Study honesty check
    const optHonest = document.createElement('button');
    optHonest.className = 'btn btn-primary';
    
    // Calc pass chance
    const passChance = Math.min(0.95, 0.2 + (state.player.intellectLvl * 0.15));
    optHonest.textContent = `Hacer examen honestamente (Éxito: ${Math.floor(passChance*100)}%)`;
    
    optHonest.addEventListener('click', () => {
        modal.classList.remove('active');
        processExamResult(Math.random() < passChance, false);
    });
    optionsContainer.appendChild(optHonest);

    // Option 2: Cheat (Requires cheat sheet)
    const hasCheatSheet = state.inventory.includes('apuntes_trampa');
    const optCheat = document.createElement('button');
    optCheat.className = hasCheatSheet ? 'btn btn-warning' : 'btn btn-neutral';
    optCheat.disabled = !hasCheatSheet;
    
    if (hasCheatSheet) {
        optCheat.textContent = `Usar Acordeón / Copiar (Éxito: 90% | Sospecha: +40)`;
    } else {
        optCheat.textContent = `Copiar (Necesitas Acordeón en Inventario)`;
    }

    optCheat.addEventListener('click', () => {
        modal.classList.remove('active');
        // Remove item cheat sheet
        const sheetIdx = state.inventory.indexOf('apuntes_trampa');
        if (sheetIdx !== -1) {
            state.inventory.splice(sheetIdx, 1);
        }
        
        // Roll detection chance (e.g. 30% chance to get caught by teacher)
        const caughtCheating = Math.random() < 0.3;
        if (caughtCheating) {
            processExamResult(false, true);
        } else {
            processExamResult(true, false, true);
        }
    });
    optionsContainer.appendChild(optCheat);

    // Option 3: Skip exam (detention / instant heat boost)
    const optSkip = document.createElement('button');
    optSkip.className = 'btn btn-danger';
    optSkip.textContent = 'Saltarse el examen (Huír a la Azotea)';
    optSkip.addEventListener('click', () => {
        modal.classList.remove('active');
        state.currentLocation = 'rooftop';
        state.player.heat = Math.min(100, state.player.heat + 35);
        logMessage(`🚨 Te escapaste del examen corriendo a la azotea. Yamada-sensei está furioso. (+35 Calor)`, 'danger');
        updateHUD();
        renderLocationDetails();
    });
    optionsContainer.appendChild(optSkip);
}

function processExamResult(passed, caught, usedCheat = false) {
    if (caught) {
        playSound('gameover');
        state.player.heat = 100; // Trigger instant GameOver via normal check
        logMessage(`🚨 ¡Yamada-sensei te atrapó copiando in-fraganti! Te confiscaron los materiales y te reportaron de inmediato.`, 'danger');
        updateHUD();
        return;
    }

    if (passed) {
        playSound('success');
        const moneyPrize = usedCheat ? 2000 : 3500;
        state.player.money += moneyPrize;
        
        let message = `🎉 ¡APROBASTE el examen final! Tu familia y maestros están orgullosos. Ganaste una beca/recompensa de ¥${moneyPrize}.`;
        if (usedCheat) message = `🤫 ¡Examen Aprobado con éxito usando el Acordeón sin ser detectado! Ganaste ¥2,000 de tus apuestas con compañeros. (+40 Calor)`;
        
        if (usedCheat) {
            state.player.heat = Math.min(100, state.player.heat + 30);
        }
        
        logMessage(message, 'success');
        
        // Show success summary screen trigger
        triggerEndscreen(true);
    } else {
        playSound('error');
        state.player.stress = Math.min(100, state.player.stress + 40);
        logMessage(`❌ REPROBASTE el examen final. Sientes un estrés tremendo y regaños infinitos. (+40 Estrés)`, 'danger');
        
        // Reprobado reduces opinion of Yuki and Yamada
        state.npcs.yuki.opinion = Math.max(-100, state.npcs.yuki.opinion - 15);
        state.npcs.yamada.opinion = Math.max(-100, state.npcs.yamada.opinion - 20);
        
        triggerEndscreen(false);
    }
    
    updateHUD();
}

function triggerEndscreen(success) {
    const scr = document.getElementById('results-screen');
    const title = document.getElementById('results-title');
    const desc = document.getElementById('results-desc');
    
    if (success) {
        title.textContent = "🎉 ¡SEMESTRE EXITOSO! 🎉";
        desc.textContent = "Lograste pasar el examen final, mantuviste tus sospechas bajo control y dominaste la vida del instituto japonés.";
    } else {
        title.textContent = "💀 REPROBADO 💀";
        desc.textContent = "Has reprobado los exámenes del viernes. Yamada-sensei te ha obligado a repetir el semestre entero.";
    }

    // Populate summary stats
    document.getElementById('res-strength').textContent = `Nivel ${state.player.strengthLvl} (${state.player.strength} XP)`;
    document.getElementById('res-intellect').textContent = `Nivel ${state.player.intellectLvl} (${state.player.intellect} XP)`;
    document.getElementById('res-charisma').textContent = `Nivel ${state.player.charismaLvl} (${state.player.charisma} XP)`;
    document.getElementById('res-money').textContent = `¥${state.player.money.toLocaleString()}`;
    document.getElementById('res-quests').textContent = state.completedQuestsCount;

    // Show Overlay
    scr.classList.add('active');
}

function triggerGameOver(reason) {
    playSound('gameover');
    const scr = document.getElementById('results-screen');
    const title = document.getElementById('results-title');
    const desc = document.getElementById('results-desc');
    
    title.textContent = "👮 EXPULSADO / ARRESTADO";
    desc.textContent = reason;

    // Populate summary stats
    document.getElementById('res-strength').textContent = `Nivel ${state.player.strengthLvl} (${state.player.strength} XP)`;
    document.getElementById('res-intellect').textContent = `Nivel ${state.player.intellectLvl} (${state.player.intellect} XP)`;
    document.getElementById('res-charisma').textContent = `Nivel ${state.player.charismaLvl} (${state.player.charisma} XP)`;
    document.getElementById('res-money').textContent = `¥${state.player.money.toLocaleString()}`;
    document.getElementById('res-quests').textContent = state.completedQuestsCount;

    // Show Overlay
    scr.classList.add('active');
}
