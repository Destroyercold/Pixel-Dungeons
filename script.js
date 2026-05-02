/* script.js - ACTUALIZADO: IA MODO Clon de sombra (RAID BOSS) + CONTROLES MOVILES Y RENDIMIENTO */

// --- PIXEL DUNGEON: ULTIMATE EDITION V25.0 ---

// --- LISTA DE REPRODUCCIÓN ---
const MUSIC_PLAYLIST = [
    { title: "Ashnikko - Worms", src: "ytmp3free.cc_ashnikko-worms-lyrics-youtubemp3free.org.mp3" },
    { title: "Coldplay - Hymn For The Weekend", src: "ytmp3free.cc_coldplay-hymn-for-the-weekend-official-video-youtubemp3free.org.mp3" },
    { title: "Alan Walker - Faded", src: "ytmp3free.cc_alan-walker-faded-youtubemp3free.org.mp3" },
    { title: "John Newman - Love Me Again", src: "ytmp3free.cc_john-newman-love-me-again-youtubemp3free.org (1).mp3" },
    { title: "Pixel Dungeon Theme", src: "menu.aac" },
    { title: "Boss Battle", src: "boss.aac" },
    { title: "Victory Theme", src: "menu.aac" }
];

let bgm = new Audio();
let currentTrackIndex = 0;
let isBossMusicActive = false;
let isMusicPlayerOpen = false; 
let isMobile = false; // Variable global para saber si estamos en movil

bgm.src = MUSIC_PLAYLIST[0].src;
bgm.loop = false; 
bgm.volume = 0.5;

bgm.addEventListener('ended', () => {
    if (!isBossMusicActive && state === 'PLAYING') playNextSong();
    else if (state === 'MENU') playNextSong(); 
});

function playTrack(index) {
    if (index >= 0 && index < MUSIC_PLAYLIST.length) {
        currentTrackIndex = index;
        let song = MUSIC_PLAYLIST[currentTrackIndex];
        bgm.src = song.src;
        bgm.play().catch(e => console.log("Interacción requerida"));
        updateMusicHUD(song.title);
        if(isMusicPlayerOpen) renderMusicPlayer();
    }
}

function playNextSong() {
    currentTrackIndex = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    playTrack(currentTrackIndex);
}

let highScore = parseInt(localStorage.getItem('pd_highscore')) || 0;

let spawnQueue = []; 
let pvpRound = 1;
let pvpMaxRounds = 10;
let pvpScores = {1:0, 2:0};
let pvpDraft = { active: false, turn: 0, picked: [] }; 
let pvpDraftOptions = [];
let optionsOrigin = 'MENU';
let brSelectedBoss = ''; 

const GAME_W = 960;
const GAME_H = 540;

let skillPoints = 0;
let purchasedSkills = {}; 

const SKILL_TREE_DATA = {
    prowler: [
        { id: 'pr_dmg_1', name: "FILO AFILADO", desc: "+5% Daño total por nivel.", cost: 1, max: 3, grid: [0,1] },
        { id: 'pr_spd_1', name: "REFLEJOS", desc: "+3% Vel. Ataque por nivel.", cost: 1, max: 3, grid: [0,2], req: 'pr_dmg_1' },
        { id: 'pr_crit_1', name: "PUNTO VITAL", desc: "+5% Prob. Crítico por nivel.", cost: 2, max: 2, grid: [1,1], req: 'pr_dmg_1' },
        { id: 'pr_dash_cd', name: "IMPULSO", desc: "-10% CD Dash por nivel.", cost: 1, max: 3, grid: [1,2], req: 'pr_spd_1' },
        { id: 'pr_vamp', name: "SED DE SANGRE", desc: "1% Robo de vida melé por nivel.", cost: 3, max: 2, grid: [2,1], req: 'pr_crit_1' },
        { id: 'pr_exec', name: "VERDUGO", desc: "+20% Daño a enemigos con <30% HP.", cost: 4, max: 1, grid: [2,2], req: 'pr_dash_cd' },
        { id: 'pr_master', name: "MAESTRO ACECHADOR", desc: "+15% Daño y +10% Vel. Mov. si no has sufrido daño en 5s.", cost: 5, max: 1, grid: [3,1], req: 'pr_vamp' }
    ],
    brave: [ 
        { id: 'br_hp_1', name: "CONSTITUCIÓN", desc: "+10 Vida Máx por nivel.", cost: 1, max: 3, grid: [0,1] },
        { id: 'br_arm_1', name: "PIEL DURA", desc: "+5 Armadura Máx por nivel.", cost: 1, max: 3, grid: [0,2], req: 'br_hp_1' },
        { id: 'br_regen', name: "RECUPERACIÓN", desc: "Regenera 1 HP cada 10s por nivel.", cost: 2, max: 3, grid: [1,1], req: 'br_hp_1' },
        { id: 'br_shld_eff', name: "BLOQUEO", desc: "+10% Eficacia Escudo (DR) por nivel.", cost: 2, max: 2, grid: [1,2], req: 'br_arm_1' },
        { id: 'br_last_st', name: "ÚLTIMO RESQUICIO", desc: "+30% DR cuando HP < 25%.", cost: 4, max: 1, grid: [2,1], req: 'br_regen' },
        { id: 'br_thorns', name: "ESPINAS", desc: "Devuelve 15% daño recibido por nivel.", cost: 3, max: 2, grid: [2,2], req: 'br_shld_eff' },
        { id: 'br_immortal', name: "INMORTAL", desc: "Al morir, resucitas con 25% HP (1 vez por partida).", cost: 5, max: 1, grid: [3,1], req: 'br_last_st' }
    ],
    forager: [ 
        { id: 'fo_gold_1', name: "CODICIA", desc: "+10% Oro de enemigos por nivel.", cost: 1, max: 3, grid: [0,1] },
        { id: 'fo_loot_1', name: "SAQUEADOR", desc: "+5% Prob. Drop items por nivel.", cost: 1, max: 3, grid: [0,2], req: 'fo_gold_1' },
        { id: 'fo_shop_disc', name: "REGATEO", desc: "-5% Costo Tienda por nivel.", cost: 2, max: 3, grid: [1,1], req: 'fo_gold_1' },
        { id: 'fo_poti_eff', name: "ALQUIMIA", desc: "+20% Eficacia Pociones por nivel.", cost: 2, max: 2, grid: [1,2], req: 'fo_loot_1' },
        { id: 'fo_miss_rew', name: "CONTRATISTA", desc: "+25% Oro recompensas misión por nivel.", cost: 3, max: 2, grid: [2,1], req: 'fo_shop_disc' },
        { id: 'fo_ammo_max', name: "BANDOLERA", desc: "+2 Munición Máx por nivel.", cost: 3, max: 2, grid: [2,2], req: 'fo_poti_eff' },
        { id: 'fo_hoarder', name: "ACUMULADOR", desc: "+1% Daño por cada 100 de oro poseído (Máx 20%).", cost: 5, max: 1, grid: [3,1], req: 'fo_miss_rew' }
    ],
    traveler: [ 
        { id: 'tr_spd_1', name: "PIES LIGEROS", desc: "+5% Vel. Movimiento por nivel.", cost: 1, max: 3, grid: [0,1] },
        { id: 'tr_abil_cd', name: "ENFOQUE", desc: "-5% CD Habilidad por nivel.", cost: 1, max: 3, grid: [0,2], req: 'tr_spd_1' },
        { id: 'tr_dodge', name: "ESQUIVE", desc: "+3% Prob. esquivar ataque por nivel.", cost: 2, max: 3, grid: [1,1], req: 'tr_spd_1' },
        { id: 'tr_abil_dur', name: "PERSISTENCIA", desc: "+10% Duración Habilidad Activa por nivel.", cost: 2, max: 2, grid: [1,2], req: 'tr_abil_cd' },
        { id: 'tr_trap_vis', name: "SENTIDO TRAMPAS", desc: "Las trampas se activan 50% más lento.", cost: 3, max: 1, grid: [2,1], req: 'tr_dodge' },
        { id: 'tr_xp_gain', name: "SABIDURÍA", desc: "+1 Punto habilidad extra cada 5 oleadas.", cost: 4, max: 1, grid: [2,2], req: 'tr_abil_dur' },
    ]
};

window.addEventListener('load', () => {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;

    const c = document.getElementById('game');
    if(c) { 
        c.width = GAME_W; 
        c.height = GAME_H; 
    }

    createMusicHUD();
    createIngameMusicPlayer(); 

    updatePreview(1); updatePreview(2); updateClassUI(1); updateClassUI(2); detectMobile();
    showHighScoreInMenu();
    organizeMainMenu(); 
    
    const mHud = document.getElementById('mission-hud');
    if(mHud && !isMobile) {
        mHud.style.top = 'auto'; mHud.style.left = 'auto'; mHud.style.bottom = '100px'; mHud.style.right = '10px'; mHud.style.textAlign = 'right'; mHud.style.position = 'absolute';
    }

    setupSkillTreeUI();

    document.body.addEventListener('click', () => {
        if (bgm.paused && state === 'MENU') {
            bgm.play().catch(e => console.log("Esperando interacción..."));
        }
    }, { once: true });
});

function createMusicHUD() {
    let hud = document.createElement('div');
    hud.id = 'music-notification';
    hud.className = 'music-hud-clickable'; 
    hud.style.position = 'absolute';
    hud.style.top = '20px';
    hud.style.right = '20px';
    hud.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hud.style.border = '2px solid #0af';
    hud.style.padding = '8px 15px';
    hud.style.color = '#fff';
    hud.style.fontFamily = "'Press Start 2P', cursive";
    hud.style.fontSize = '10px';
    hud.style.display = 'none'; 
    hud.style.zIndex = '1000';
    hud.style.cursor = 'pointer'; 
    hud.style.pointerEvents = 'auto'; 
    
    hud.innerHTML = `?? <span id="music-title">...</span> (CLICK)`;
    hud.onclick = () => { toggleMusicModal(); };
    document.body.appendChild(hud);
}

function createIngameMusicPlayer() {
    let modal = document.createElement('div');
    modal.id = 'ingame-music-player';
    modal.style.display = 'none';
    modal.innerHTML = `
        <div class="player-header">
            <span>?? REPRODUCTOR</span>
            <button class="close-player" onclick="toggleMusicModal()">X</button>
        </div>
        <div class="player-body">
            <div class="playlist-col" id="player-playlist"></div>
        </div>
        <div class="player-controls">
            <div style="text-align:center; margin-bottom:10px;">
                <button class="btn" style="border-color:#0f0; width:60%; padding:10px;" onclick="toggleMusic()">? PLAY / PAUSE</button>
            </div>
            <div class="time-info">
                <span id="curr-time">0:00</span>
                <input type="range" id="seek-bar" min="0" value="0" step="0.1">
                <span id="total-time">0:00</span>
            </div>
            <div class="vol-controls">
                <span>VOL:</span>
                <input type="range" min="0" max="1" step="0.1" value="0.5" onchange="setMusicVol(this.value)">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('seek-bar').addEventListener('input', (e) => {
        if(bgm.duration) bgm.currentTime = (e.target.value / 100) * bgm.duration;
    });
}

function toggleMusicModal() {
    isMusicPlayerOpen = !isMusicPlayerOpen;
    const modal = document.getElementById('ingame-music-player');
    modal.style.display = isMusicPlayerOpen ? 'flex' : 'none';
    if(isMusicPlayerOpen) renderMusicPlayer();
}

function renderMusicPlayer() {
    const listContainer = document.getElementById('player-playlist');
    listContainer.innerHTML = '';
    
    MUSIC_PLAYLIST.forEach((song, idx) => {
        let btn = document.createElement('div');
        btn.className = 'playlist-item ' + (idx === currentTrackIndex ? 'active' : '');
        btn.innerText = (idx + 1) + ". " + song.title;
        btn.onclick = () => playTrack(idx);
        listContainer.appendChild(btn);
    });
}

function updateMusicPlayerUI() {
    if(!isMusicPlayerOpen) return;
    const curTimeEl = document.getElementById('curr-time');
    const totTimeEl = document.getElementById('total-time');
    const seekBar = document.getElementById('seek-bar');
    
    if(bgm.duration) {
        let pct = (bgm.currentTime / bgm.duration) * 100;
        seekBar.value = pct;
        curTimeEl.innerText = formatTime(bgm.currentTime);
        totTimeEl.innerText = formatTime(bgm.duration);
    }
}

function formatTime(seconds) {
    if(isNaN(seconds)) return "0:00";
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateMusicHUD(title) {
    const el = document.getElementById('music-title');
    if(el) el.innerText = title;
    const hud = document.getElementById('music-notification');
    if(hud) {
        hud.style.display = 'block';
        hud.style.borderColor = '#fff';
        setTimeout(() => hud.style.borderColor = '#0af', 200);
    }
}

function organizeMainMenu() {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('inventory-hud').style.display = 'none';
    
    const menuGroup = document.querySelector('.menu-btn-group');
    if(!menuGroup) return;

    menuGroup.innerHTML = `
        <div id="record-display" style="color:#fe0; text-align:center; margin-bottom:10px; font-size:12px; text-shadow:2px 2px #000; z-index:10; position:relative;">RÉCORD: ${highScore}</div>
        <button id="btn-continue" class="btn" style="border-color:#0f0; display:none; z-index:10; position:relative;" onclick="loadGame()">CONTINUAR PARTIDA</button>
        
        <div style="display:flex; gap:10px; margin-bottom:10px; z-index:10; position:relative;">
            <button class="btn" onclick="startGame(false)" style="flex:1;">SOLITARIO</button>
            <button class="btn" onclick="startGame(true)" style="flex:1;">CO-OP</button>
        </div>
        
        <button class="btn" style="border-color:#f80; color:#f80; margin-bottom:10px; z-index:10; position:relative;" onclick="startPvP()">PVP: TORNEO (1v1)</button>
        <button class="btn" style="border-color:#f0f; color:#f0f; margin-bottom:10px; z-index:10; position:relative;" onclick="openBossRushMenu()">MODO JEFES</button>
        
        <div style="display:flex; gap:10px; margin-bottom:10px; z-index:10; position:relative;">
            <button class="btn" style="border-color:#1db954; color:#1db954; flex:1;" onclick="toggleMusicModal()">MUSICA</button>
        </div>
        
        <button id="btn-mode" class="btn" style="border-color:#a0a; font-size:10px; padding:10px; z-index:10; position:relative;" onclick="toggleGameMode()">MODO: NORMAL</button>
        <div style="display:flex; gap:10px; margin-top:5px; z-index:10; position:relative;">
            <button class="btn" style="border-color:#fe0; font-size:10px; padding:10px;" onclick="openOptions()">OPCIONES</button>
            <button class="btn" onclick="deleteGame()" style="border-color:#f44; font-size:10px; padding:10px;">BORRAR DATOS</button>
        </div>
    `;
    if(localStorage.getItem('pd_save_data')) document.getElementById('btn-continue').style.display='block';
}

function updateMobileOpacity(val) {
    let mc = document.getElementById('mobile-controls');
    if(mc) mc.style.opacity = val;
}

function updateHUDLayout() {
    let hudLeft = document.getElementById('hud-left');
    let hudRight = document.getElementById('hud-right');
    let hpBarArea = document.getElementById('hp-bar-area');
    
    if(isMobile) {
        if(hudLeft && hudRight && hpBarArea) {
             hudRight.appendChild(hpBarArea);
        }
    } else {
        if(hudLeft && hudRight && hpBarArea) {
             hudLeft.appendChild(hpBarArea);
        }
    }
}

function swapMobileHUD() {
    const controls = document.getElementById('mobile-controls');
    controls.classList.toggle('flipped');
}

function openBossRushMenu() {
    document.getElementById('main-menu').style.display = 'none';
    let overlay = document.getElementById('boss-rush-menu');
    if(!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'boss-rush-menu';
        overlay.className = 'overlay';
        overlay.style.background = '#111';
        overlay.style.zIndex = '200';
        document.getElementById('game-wrapper').appendChild(overlay);
    }
    overlay.style.display = 'flex';

    let wOpts = Object.keys(WEAPONS).filter(k => k !== 'FIST').map(k => `<option value="${k}">${WEAPONS[k].name}</option>`).join('');
    let wOpts2 = `<option value="none">NINGUNA</option>` + wOpts;
    let rOpts = RELICS.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    let bOpts = `
        <option value="SKELETON">REY ESQUELETO</option>
        <option value="GOLEM">GOLEM MADERA</option>
        <option value="DEMON">DEMONIO MAGMA</option>
        <option value="AI_BOSS">Clon de sombra (JEFE RAID)</option>
    `;
    let dOpts = `
        <option value="0.8">FÁCIL (80%)</option>
        <option value="1">NORMAL (100%)</option>
        <option value="1.5">DIFÍCIL (150%)</option>
        <option value="2.5">EXTREMO (250%)</option>
    `;

    overlay.innerHTML = `
        <h1 style="color:#f0f; text-shadow:2px 2px #000; margin-bottom:20px;">MODO JEFES</h1>
        <div style="background:#222; padding:20px; border:2px solid #555; border-radius:10px; display:flex; flex-direction:column; gap:15px; width:300px; color:#fff; font-size:10px;">
            <div><label style="color:#0af">ARMA PRINCIPAL:</label><br><select id="br-weapon" style="width:100%; padding:5px; margin-top:5px; background:#000; color:#fff; border:1px solid #0af; font-family:inherit; font-size:10px;">${wOpts}</select></div>
            <div><label style="color:#0af">ARMA SECUNDARIA:</label><br><select id="br-weapon-2" style="width:100%; padding:5px; margin-top:5px; background:#000; color:#fff; border:1px solid #0af; font-family:inherit; font-size:10px;">${wOpts2}</select></div>
            <div><label style="color:#0f0">RELIQUIA:</label><br><select id="br-relic" style="width:100%; padding:5px; margin-top:5px; background:#000; color:#fff; border:1px solid #0f0; font-family:inherit; font-size:10px;"><option value="none">NINGUNA</option>${rOpts}</select></div>
            <div><label style="color:#f44">JEFE A ENFRENTAR:</label><br><select id="br-boss" style="width:100%; padding:5px; margin-top:5px; background:#000; color:#fff; border:1px solid #f44; font-family:inherit; font-size:10px;">${bOpts}</select></div>
            <div><label style="color:#fe0">DIFICULTAD:</label><br><select id="br-diff" style="width:100%; padding:5px; margin-top:5px; background:#000; color:#fff; border:1px solid #fe0; font-family:inherit; font-size:10px;">${dOpts}</select></div>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn" style="border-color:#f0f; width:150px; font-size:10px;" onclick="startBossRush()">LUCHAR!</button>
            <button class="btn" style="border-color:#aaa; width:150px; font-size:10px;" onclick="closeBossRushMenu()">VOLVER</button>
        </div>
    `;
}

function closeBossRushMenu() { document.getElementById('boss-rush-menu').style.display = 'none'; document.getElementById('main-menu').style.display = 'flex'; }

function startBossRush() {
    brSelectedBoss = document.getElementById('br-boss').value;
    enemyPower = parseFloat(document.getElementById('br-diff').value);
    document.getElementById('boss-rush-menu').style.display = 'none';
    gameMode = 'BOSSRUSH';
    startGame(false); 
}

function showHighScoreInMenu() {
    let rec = document.getElementById('record-display');
    if(rec) rec.innerText = 'RÉCORD MÁXIMO: OLEADA ' + highScore;
}

function startGame(coop) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if (bgm.paused || bgm.src.includes('menu.aac')) playTrack(0); 

    document.getElementById('hud').style.display = 'flex';
    if(!isMobile) document.getElementById('inventory-hud').style.display = 'flex';

    isCoop = coop;
    state = 'STARTING'; 
    
    if(gameMode !== 'BOSSRUSH' && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && gameMode !== 'MADMAN') gameMode = 'NORMAL';

    gameTick = 0; gold = 0; wave = 1; spawnQueue = []; 

    skillPoints = 0; purchasedSkills = {};
    updateSkillTreeVisuals(); 
    
    p1=new Player(1, SKINS[p1SkinIdx], CLASSES[p1ClassIdx].id); 
    p2=new Player(2, SKINS[p2SkinIdx], CLASSES[p2ClassIdx].id);
    
    if(!isCoop && gameMode !== 'PVP') p2.alive=false;
    
    if(gameMode === 'BOSSRUSH') {
        let wKey1 = document.getElementById('br-weapon').value;
        let wKey2 = document.getElementById('br-weapon-2').value;
        let rKey = document.getElementById('br-relic').value;
        p1.inventory = [wKey1]; p1.weaponLevels[wKey1] = 5;
        if(wKey2 !== 'none' && wKey2 !== wKey1) { p1.inventory.push(wKey2); p1.weaponLevels[wKey2] = 5; }
        if(!p1.inventory.includes('SHIELD')) p1.inventory.push('SHIELD');
        p1.weapon = WEAPONS[wKey1];
        p1.hp = 500; p1.maxHp = 500; p1.armor = 100; p1.maxArmor = 100; p1.hasShield = true;
        if(rKey !== 'none') p1.relics.push(rKey);
        document.getElementById('skill-points-hud').style.display = 'none';
    } else if(gameMode === 'PVP') {
        pvpRound = 1; pvpScores = {1:0, 2:0}; resetPvPStats(); gold = 0; 
        document.getElementById('madman-timer').style.display = 'none';
        floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "RONDA 1: ¡LUCHA!", "#f00", 30));
        document.getElementById('skill-points-hud').style.display = 'none'; 
    } else if(gameMode === 'SANDBOX') {
        document.getElementById('skill-points-hud').style.display = 'none'; 
    } else {
        document.getElementById('skill-points-hud').style.display = 'block'; updateSkillPointsHUD();
    }

    if(gameMode === 'MADMAN') { madmanTimer = 3600; document.getElementById('madman-timer').style.display = 'block'; } 
    else document.getElementById('madman-timer').style.display = 'none';

    document.getElementById('sandbox-controls').style.display = (gameMode === 'SANDBOX' && !isMobile) ? 'block' : 'none';
    if(gameMode === 'SANDBOX') gold = 999999;

    document.getElementById('main-menu').style.display='none';
    document.getElementById('p2-hud-area').style.display = (isCoop || gameMode === 'PVP') ? 'block' : 'none';
    document.getElementById('coop-msg').style.display = isCoop ? 'inline' : 'none';
    
    document.getElementById('music-notification').style.display = 'block';
    updateMusicHUD(MUSIC_PLAYLIST[currentTrackIndex].title);

    const skillBtn = document.getElementById('btn-skills-pause');
    if(skillBtn) skillBtn.style.display = (gameMode === 'PVP' || gameMode === 'SANDBOX' || gameMode === 'BOSSRUSH') ? 'none' : 'block';

    spawnLevel(); 
    state = 'PLAYING';
    
    if(!window.isLooping) { window.isLooping = true; loop(); }
    updateRelicUI(); updateInventoryUI(); updateHUDLayout();
}

function startPvP() { gameMode = 'PVP'; startGame(true); }

function resetPvPStats() {
    p1.hp = 500; p1.maxHp = 500; p1.armor = 0; p1.alive = true;
    p2.hp = 500; p2.maxHp = 500; p2.armor = 0; p2.alive = true;
    if(pvpRound === 1) {
        p1.weapon = WEAPONS.SWORD; p1.inventory = ['SWORD'];
        p2.weapon = WEAPONS.SWORD; p2.inventory = ['SWORD'];
    }
}

function playBossMusic(waveNum) {
    isBossMusicActive = true; bgm.pause();
    let track = "";
    if (waveNum === 5) track = "boss.aac";
    else if (waveNum === 10) track = "boss2.aac"; 
    else if (waveNum % 5 === 0) track = Math.random() < 0.5 ? "boss.aac" : "boss2.aac";

    if (track !== "") {
        bgm.src = track; bgm.play().catch(e => console.log("Haz clic para activar música"));
        const sn = document.getElementById('song-name');
        if(sn) { sn.innerText = "BOSS: " + track; sn.style.color = "#f00"; }
        updateMusicHUD("BOSS THEME");
    }
}

function fadeOutMusic() {
    const fadeInterval = setInterval(() => {
        if (bgm.volume > 0.05) bgm.volume -= 0.05; 
        else { 
            bgm.pause(); bgm.volume = 0.5; clearInterval(fadeInterval); isBossMusicActive = false; playTrack(currentTrackIndex);
        }
    }, 100); 
}

function toggleMusic(){ if(bgm.paused && bgm.src) bgm.play(); else bgm.pause(); }
function setMusicVol(v){ bgm.volume = v; }

const DEFAULT_KEYS = {p1_up:'w',p1_down:'s',p1_left:'a',p1_right:'d',p1_atk:'e',p1_dash:' ',p1_shield:'r',p1_special:'f', p1_lock: 'q', p1_skills: 'control', p2_up:'arrowup',p2_down:'arrowdown',p2_left:'arrowleft',p2_right:'arrowright',p2_atk:'l', p2_dash:'k', p2_shield:'j', p2_special:';', p2_lock: 'u'};
let KEYBINDS = JSON.parse(localStorage.getItem('pd_keybinds')) || {...DEFAULT_KEYS};
let bindingAction = null;
function saveKeys() { localStorage.setItem('pd_keybinds', JSON.stringify(KEYBINDS)); }
function restoreDefaultKeys() { KEYBINDS = {...DEFAULT_KEYS}; saveKeys(); renderControls(); }
function getKeyLabel(key) { if(key===' ')return'SPACE'; if(key==='control')return'CTRL'; if(key.includes('arrow'))return key.replace('arrow','').toUpperCase(); return key.toUpperCase(); }
function startRebind(action) { bindingAction=action; renderControls(); }
function renderControls() {
    const render = (map, id) => {
        let h = `<h3>${id===1?'JUGADOR 1':'JUGADOR 2'}</h3>` + map.map(i => `<div class="opt-row"><span>${i.l}</span><button class="key-btn ${bindingAction===i.k?'binding':''}" onclick="startRebind('${i.k}')">${bindingAction===i.k?'...':getKeyLabel(KEYBINDS[i.k])}</button></div>`).join('');
        const el = document.getElementById(id===1?'p1-controls':'p2-controls');
        if(el) el.innerHTML = h;
    };
    render([{k:'p1_up',l:'ARRIBA'},{k:'p1_down',l:'ABAJO'},{k:'p1_left',l:'IZQUIERDA'},{k:'p1_right',l:'DERECHA'},{k:'p1_atk',l:'ATACAR'},{k:'p1_dash',l:'DASH'},{k:'p1_shield',l:'ESCUDO'}, {k:'p1_special', l:'HABILIDAD'}, {k:'p1_lock', l:'FIJAR'}, {k:'p1_skills', l:'ÁRBOL HABIL.'}], 1);
    render([{k:'p2_up',l:'ARRIBA'},{k:'p2_down',l:'ABAJO'},{k:'p2_left',l:'IZQUIERDA'},{k:'p2_right',l:'DERECHA'},{k:'p2_atk',l:'ATACAR'},{k:'p2_dash',l:'DASH'},{k:'p2_shield',l:'ESCUDO'}, {k:'p2_special', l:'HABILIDAD'}, {k:'p2_lock', l:'FIJAR'}], 2);
}

let CONFIG = { sfx: true, particles: true };
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(type) {
    if(!CONFIG.sfx || audioCtx.state === 'suspended') return;
    const osc=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;
    if(type==='hit'){osc.type='sawtooth';osc.frequency.setValueAtTime(100,t);osc.frequency.exponentialRampToValueAtTime(10,t+0.1);g.gain.setValueAtTime(0.3,t);}
    if(type==='swing'){osc.type='triangle';osc.frequency.setValueAtTime(200,t);osc.frequency.linearRampToValueAtTime(50,t+0.15);g.gain.setValueAtTime(0.1,t);}
    if(type==='shoot'){osc.type='sawtooth';osc.frequency.setValueAtTime(600,t);osc.frequency.exponentialRampToValueAtTime(100,t+0.1);g.gain.setValueAtTime(0.1,t);}
    if(type==='shotgun'){osc.type='square';osc.frequency.setValueAtTime(80,t);osc.frequency.exponentialRampToValueAtTime(20,t+0.25);g.gain.setValueAtTime(0.4,t);}
    if(type==='heavy_shoot'){osc.type='square';osc.frequency.setValueAtTime(80,t);osc.frequency.exponentialRampToValueAtTime(20,t+0.3);g.gain.setValueAtTime(0.2,t);}
    if(type==='reload'){osc.type='sine';osc.frequency.setValueAtTime(600,t);osc.frequency.linearRampToValueAtTime(800,t+0.1);g.gain.setValueAtTime(0.1,t);}
    if(type==='coin'){osc.type='sine';osc.frequency.setValueAtTime(1500,t);osc.frequency.exponentialRampToValueAtTime(2000,t+0.1);g.gain.setValueAtTime(0.05,t);}
    if(type==='block'){osc.type='square';osc.frequency.setValueAtTime(150,t);osc.frequency.exponentialRampToValueAtTime(300,t+0.1);g.gain.setValueAtTime(0.1,t);}
    if(type==='dash'){osc.type='triangle';osc.frequency.setValueAtTime(300,t);osc.frequency.linearRampToValueAtTime(50,t+0.2);}
    if(type==='explo'){osc.type='sawtooth';osc.frequency.setValueAtTime(100,t);osc.frequency.linearRampToValueAtTime(10,t+0.5);g.gain.setValueAtTime(0.4,t);}
    if(type==='boss'){osc.type='sawtooth';osc.frequency.setValueAtTime(50,t);osc.frequency.linearRampToValueAtTime(10,t+1.5);g.gain.setValueAtTime(0.5,t);}
    if(type==='mission'){osc.type='sine';osc.frequency.setValueAtTime(400,t);osc.frequency.linearRampToValueAtTime(800,t+0.5);g.gain.setValueAtTime(0.1,t);}
    if(type==='enchant'){osc.type='sine';osc.frequency.setValueAtTime(800,t);osc.frequency.linearRampToValueAtTime(1200,t+0.5);g.gain.setValueAtTime(0.3,t);}
    if(type==='powerup'){osc.type='square';osc.frequency.setValueAtTime(400,t);osc.frequency.linearRampToValueAtTime(1000,t+0.3);g.gain.setValueAtTime(0.2,t);}
    if(type==='tick'){osc.type='sine';osc.frequency.setValueAtTime(1000,t);osc.frequency.linearRampToValueAtTime(1200,t+0.05);g.gain.setValueAtTime(0.1,t);}
    
    g.gain.linearRampToValueAtTime(0,t+(type==='boss'?1.5:0.3));
    osc.connect(g);g.connect(audioCtx.destination);osc.start();osc.stop(t+(type==='boss'?1.5:0.3));
}

const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let gameMode = 'NORMAL'; 
let madmanTimer = 0;
let sandboxBotAggro = false;

function toggleGameMode(){
    if(gameMode==='NORMAL'){ 
        gameMode='MADMAN'; document.getElementById('btn-mode').innerText="MODO: MAZMORRA LOCO"; document.getElementById('btn-mode').style.borderColor='#f0f'; 
    } else if(gameMode==='MADMAN'){
        gameMode='SANDBOX'; document.getElementById('btn-mode').innerText="MODO: SANDBOX"; document.getElementById('btn-mode').style.borderColor='#0ff';
    } else { 
        gameMode='NORMAL'; document.getElementById('btn-mode').innerText="MODO: NORMAL"; document.getElementById('btn-mode').style.borderColor='#a0a'; 
    }
}

function toggleSandboxBot(){
    sandboxBotAggro = !sandboxBotAggro;
    let b = document.getElementById('btn-bot-aggro');
    if(b){
        b.innerText = sandboxBotAggro ? "BOT: AGRESIVO" : "BOT: PASIVO";
        if(sandboxBotAggro) b.classList.add('sb-active'); else b.classList.remove('sb-active');
    }
}

function openOptions(fromPause = false) { 
    if(fromPause) { optionsOrigin = 'PAUSE'; document.getElementById('pause-menu').style.display='none'; } 
    else { optionsOrigin = 'MENU'; document.getElementById('main-menu').style.display='none'; }
    document.getElementById('options-menu').style.display='flex'; renderControls(); 
}

function closeOptions() { 
    document.getElementById('options-menu').style.display='none'; bindingAction=null; 
    if(optionsOrigin === 'PAUSE') document.getElementById('pause-menu').style.display='flex';
    else document.getElementById('main-menu').style.display='flex';
}

function toggleOpt(key) { if(key==='sfx'){CONFIG.sfx=!CONFIG.sfx;document.getElementById('opt-sfx').innerText=CONFIG.sfx?"ON":"OFF";} if(key==='part'){CONFIG.particles=!CONFIG.particles;document.getElementById('opt-part').innerText=CONFIG.particles?"ON":"OFF";} }

const SKINS = [{name:"AZUL",body:"#36f",visor:"#000",detail:"#0af"},{name:"ROJO",body:"#f33",visor:"#300",detail:"#f88"},{name:"SOMBRA",body:"#333",visor:"#f00",detail:"#666"},{name:"PALADIN",body:"#ea0",visor:"#fff",detail:"#fd0"},{name:"TOXICO",body:"#4b4",visor:"#030",detail:"#bfb"},{name:"HIELO",body:"#0ff",visor:"#008",detail:"#fff"}];
let p1SkinIdx = 0, p2SkinIdx = 1;
function changeSkin(pid, dir) { if(pid===1) { p1SkinIdx = (p1SkinIdx+dir+SKINS.length)%SKINS.length; updatePreview(1); } else { p2SkinIdx = (p2SkinIdx+dir+SKINS.length)%SKINS.length; updatePreview(2); } }
function updatePreview(pid) { let s=SKINS[pid===1?p1SkinIdx:p2SkinIdx], el=document.getElementById(pid===1?'p1-preview':'p2-preview'); document.getElementById(pid===1?'p1-skin-name':'p2-skin-name').innerText=s.name; el.style.backgroundColor=s.body; el.style.boxShadow=`inset 0 0 0 4px ${s.detail}`; el.innerHTML=`<div style="width:100%; height:30%; background:${s.visor}; position:absolute; top:20%;"></div>`; }

const CLASSES = [
    {id:'WARRIOR', name:'GUERRERO', desc:'Hab: FURIA (Daño x2, Dura+++). Pasiva: +Daño al perder HP.'},
    {id:'SCOUT', name:'CAZADOR', desc:'Hab: EVASION (Munición INF, Dura+++). Pasiva: Cura HP por kill.'},
    {id:'TANK', name:'TANQUE', desc:'Hab: ESCUDO (50% DR, Dura+++). Pasiva: Escudo inicial.'},
    {id:'MAGE', name:'TIRADOR', desc:'Hab: RAFAGA (+Daño dist, Dura+++). Pasiva: +Dmg/CD dist. -10% Dmg melé.'}
];
let p1ClassIdx = 0, p2ClassIdx = 0;
function changeClass(pid, dir) { if(pid===1) { p1ClassIdx = (p1ClassIdx+dir+CLASSES.length)%CLASSES.length; updateClassUI(1); } else { p2ClassIdx = (p2ClassIdx+dir+CLASSES.length)%CLASSES.length; updateClassUI(2); } }
function updateClassUI(pid) { let c = CLASSES[pid===1?p1ClassIdx:p2ClassIdx]; document.getElementById(pid===1?'p1-class-name':'p2-class-name').innerText=c.name; document.getElementById(pid===1?'p1-class-desc':'p2-class-desc').innerText=c.desc; }

const BIOMES = [ 
    {name:"CRIPTA",bg:"#15151a",floor:"#1a1a1a",wall:"#334",boss:"REY ESQUELETO",bossColor:"#ccc",bossType:'SKELETON'}, 
    {name:"BOSQUE",bg:"#0a100a",floor:"#152015",wall:"#203020",boss:"GOLEM MADERA",bossColor:"#642",bossType:'GOLEM'}, 
    {name:"MAGMA",bg:"#150505",floor:"#251010",wall:"#502020",boss:"DEMONIO MAGMA",bossColor:"#f00",bossType:'DEMON'},
    {name:"OSARIO",bg:"#1a1515",floor:"#2a2525",wall:"#eec",boss:"LICHE",bossColor:"#ffe",bossType:'SKELETON'}
];

const WEAPONS = {
    FIST:{id:0,name:"PUÑOS",dmg:20,range:40,cd:12,type:'melee',color:'#fa0',recoil:0,cost:0,shake:0}, 
    SWORD:{id:1,name:"ESPADA",dmg:45,range:65,cd:35,type:'melee',color:'#ccc',recoil:1,cost:100,shake:0}, 
    AXE:{id:2,name:"HACHA",dmg:90,range:65,cd:75,type:'melee',color:'#a44',recoil:3,cost:150,shake:2}, 
    SPEAR:{id:3,name:"LANZA",dmg:45,range:125,cd:25,type:'melee',color:'#88a',recoil:1,cost:120,shake:0}, 
    SHIELD:{id:4,name:"ESCUDO",dmg:25,range:50,cd:15,type:'melee',color:'#44a',recoil:0,cost:100,shake:0}, 
    BOW:{id:5,name:"ARCO",dmg:50,range:500,cd:45,type:'ranged',color:'#853',recoil:3,cost:150,shake:0}, 
    REVOLVER:{id:6,name:"REVOLVER",dmg:70,range:450,cd:45,type:'ranged',color:'#da2',recoil:5,maxAmmo:6,reloadTime:150,cost:150,shake:2}, 
    STAFF:{id:8,name:"VARA FUEGO",dmg:65,range:400,cd:60,type:'ranged',color:'#f50',recoil:4,cost:450,legendary:true,explosive:true,shake:3}, 
    CROSSBOW:{id:9,name:"BALLESTA",dmg:100,range:600,cd:80,type:'ranged',color:'#543',recoil:8,cost:350,legendary:true,pierce:true,shake:1},
    SHOTGUN:{id:14,name:"ESCOPETA",dmg:35,range:150,cd:60,type:'ranged',color:'#666',recoil:15,cost:200,count:5,spread:0.6,shake:6,maxAmmo:2,reloadTime:120}, 
    MJOLNIR:{id:10,name:"MJOLNIR",dmg:100,range:70,cd:60,type:'melee',color:'#eef',recoil:2,cost:1000,legendary:true,shake:4,lightning:true},
    GOLDGUN:{id:13,name:"CAÑON ORO",dmg:500,range:1000,cd:200,type:'ranged',color:'#fd0',recoil:20,cost:1000,unique:true,shake:10,explosive:true},
    BISONTE:{id:15,name:"BISONTE",dmg:100,range:75,cd:70,type:'melee',color:'#f44',recoil:4,cost:1500,unique:true,shake:5,explosive:false} 
};

const ENCHANTS = [
    {id:'sharp', name:'AFILADO', desc:'+25% DAÑO', type:'OFENSIVO'},
    {id:'haste', name:'PRISA', desc:'-15% RECARGA ATAQUE', type:'UTILIDAD'},
    {id:'heavy', name:'PESADO', desc:'+50% EMPUJE', type:'CONTROL'},
    {id:'sniper', name:'FRANCOTIRADOR', desc:'+30% ALCANCE', type:'OFENSIVO'},
    {id:'vampire', name:'VAMPIRO', desc:'5% PROB. CURARSE', type:'MAGIA'},
    {id:'thunder', name:'RAYO', desc:'20% PROB. RAYO', type:'MAGIA'},
    {id:'explosive', name:'EXPLOSIVO', desc:'10% PROB. EXPLOSION', type:'MAGIA'},
    {id:'multishot', name:'MULTITIDISPARO', desc:'20% PROB. DOBLE TIRO', type:'OFENSIVO'},
    {id:'greed', name:'CODICIA', desc:'ENEMIGOS DAN +ORO', type:'UTILIDAD'},
    {id:'feather', name:'PLUMA', desc:'+10% VEL. MOVIMIENTO (AL SOSTENER)', type:'MOVILIDAD'},
    {id:'tank', name:'PROTECCION', desc:'+20 ARMADURA (AL SOSTENER)', type:'DEFENSIVO'},
    {id:'ammo', name:'CARGADOR', desc:'+3 MUNICION MAX', type:'UTILIDAD'}
];

const RELICS = [
    {id:'vamp', name:'VAMPIRISMO', desc:'Recupera 2 HP al matar', cost:300},
    {id:'rage', name:'BERSERKER', desc:'+20% Daño cuando HP < 50%', cost:250},
    {id:'speed', name:'BOTAS ALADAS', desc:'+15% Velocidad de Movimiento', cost:200},
    {id:'glass', name:'CAÑON CRISTAL', desc:'+40% Daño, -30% Vida Max', cost:350},
    {id:'thorns', name:'ESPINAS', desc:'Devuelve daño al ser golpeado', cost:250},
    {id:'ammo', name:'CARTUCHERA', desc:'Recarga 2 veces más rápido', cost:200},
    {id:'regen', name:'REGENERACION', desc:'Recupera 1 HP cada 5 seg', cost:400},
    {id:'dodge', name:'ESQUIVE', desc:'Esquiva 3 ataques (10s CD)', cost:400}
];

let state='MENU', wave=1, gold=0, isCoop=false, keys={}, enemyPower=1, gameTick=0;
let p1, p2, enemies=[], projectiles=[], enemyBullets=[], structures=[], warnings=[], currentBiome=BIOMES[0];
let particles=[], floatTexts=[], decals=[], screenShake=0;
let traps = [];

let joyActive = false, joyAngle = 0, joyDist = 0, currentInvIdx = 0;

function saveGame() {
    if(state !== 'PAUSED') return;
    const save = {
        wave, gold, gameMode, isCoop, skillPoints, purchasedSkills, 
        p1: { skinIdx: p1SkinIdx, classIdx: p1ClassIdx, hp: p1.hp, maxHp: p1.maxHp, armor: p1.armor, inventory: p1.inventory, weaponLevels: p1.weaponLevels, relics: p1.relics, weaponEnchants: p1.weaponEnchants, hasShield: p1.hasShield, weaponKey: getWeaponKeyName(p1.weapon.id), abilityTimer: p1.abilityTimer, abilityActiveTimer: p1.abilityActiveTimer },
        p2: { skinIdx: p2SkinIdx, classIdx: p2ClassIdx, hp: p2.hp, maxHp: p2.maxHp, armor: p2.armor, inventory: p2.inventory, weaponLevels: p2.weaponLevels, relics: p2.relics, weaponEnchants: p2.weaponEnchants, hasShield: p2.hasShield, weaponKey: getWeaponKeyName(p2.weapon.id), alive: p2.alive, abilityTimer: p2.abilityTimer, abilityActiveTimer: p2.abilityActiveTimer }
    };
    localStorage.setItem('pd_save_data', JSON.stringify(save));
    floatTexts.push(new FloatText(GAME_W/2, 350, "PROGRESO GUARDADO!", "#0f0", 20)); setTimeout(() => alert("Juego Guardado Correctamente"), 100);
}

function loadGame() {
    const dataStr = localStorage.getItem('pd_save_data');
    if(!dataStr) return; const save = JSON.parse(dataStr);
    if(audioCtx.state==='suspended')audioCtx.resume();
    wave = save.wave; gold = save.gold; gameMode = save.gameMode; isCoop = save.isCoop;
    skillPoints = save.skillPoints || 0; purchasedSkills = save.purchasedSkills || {}; updateSkillTreeVisuals();
    p1SkinIdx = save.p1.skinIdx; p1ClassIdx = save.p1.classIdx; p2SkinIdx = save.p2.skinIdx; p2ClassIdx = save.p2.classIdx;
    startGame(isCoop); 
    const applyData = (p, d) => {
        p.hp = d.hp; p.maxHp = d.maxHp; p.armor = d.armor; p.inventory = d.inventory; p.weaponLevels = d.weaponLevels; p.relics = d.relics; p.weaponEnchants = d.weaponEnchants; p.hasShield = d.hasShield; p.abilityTimer = d.abilityTimer; p.abilityActiveTimer = d.abilityActiveTimer;
        if(d.weaponKey && WEAPONS[d.weaponKey]) p.weapon = WEAPONS[d.weaponKey]; if(p.id === 2) p.alive = d.alive;
        if(p.id === 1 && purchasedSkills['br_hp_1']) p.maxHp += purchasedSkills['br_hp_1'] * 10;
    };
    applyData(p1, save.p1); applyData(p2, save.p2);
    updateInventoryUI(); updateRelicUI(); document.getElementById('btn-continue').style.display='none';
}

function deleteGame() { if(confirm("¿Seguro que quieres borrar tu progreso?")) { localStorage.removeItem('pd_save_data'); document.getElementById('btn-continue').style.display='none'; } }

let currentMission = null;
const MISSIONS = [{type:'kill_melee', target:5, desc:"MATA 5 A MELÉ", reward:'gold'},{type:'no_hit', target:1, desc:"COMPLETA SIN DAÑO", reward:'gold'},{type:'kill_shooter', target:3, desc:"CAZA 3 TIRADORES", reward:'gold'},{type:'kill_elite', target:1, desc:"ELIMINA 1 ELITE", reward:'gold'}];
function startMission() { if(wave <= 3 || wave%5===0 || gameMode==='SANDBOX' || gameMode==='BOSSRUSH'){ currentMission=null; document.getElementById('mission-hud').style.display='none'; return; } let m = MISSIONS[Math.floor(Math.random()*MISSIONS.length)]; currentMission = { ...m, progress: 0, completed: false, failed: false }; updateMissionHUD(); document.getElementById('mission-hud').style.display='block'; }
function checkMission(evt, val=1) { if(!currentMission || currentMission.completed || currentMission.failed) return; if(currentMission.type === evt) { currentMission.progress += val; if(currentMission.progress >= currentMission.target) completeMission(); } if(evt === 'damage') { currentMission.failed = true; updateMissionHUD(); } updateMissionHUD(); }
function completeMission() { currentMission.completed = true; playSfx('mission'); updateMissionHUD(); gold += 150; floatTexts.push(new FloatText(GAME_W/2, 350, "+150 ORO DE MISION!", "#ff0")); if(gameMode === 'MADMAN') madmanTimer += 30*60;  }
function updateMissionHUD() { let el = document.getElementById('mission-desc'); let pr = document.getElementById('mission-progress'); let d = document.getElementById('mission-hud'); if(!currentMission) { d.style.display='none'; return; } if(currentMission.failed) { el.innerText = "MISION FALLIDA"; el.style.color="#f00"; pr.innerText=""; } else if(currentMission.completed) { el.innerText = "MISION COMPLETADA"; el.classList.add('mission-complete'); pr.innerText=""; } else { el.innerText = currentMission.desc; el.style.color="#fe0"; el.classList.remove('mission-complete'); pr.innerText = `[${currentMission.progress}/${currentMission.target}]`; } }

class Particle{constructor(x,y,color,vx,vy,life,size=2){this.x=x;this.y=y;this.color=color;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;this.size=size;}update(){this.x+=this.vx;this.y+=this.vy;this.life--;}draw(c){c.globalAlpha=this.life/this.maxLife;c.fillStyle=this.color;c.fillRect(this.x,this.y,this.size,this.size);c.globalAlpha=1;}}
class FloatText{constructor(x,y,text,color,size=10){this.x=x;this.y=y;this.text=text;this.color=color;this.life=40;this.vy=-1.5;this.size=size}update(){this.y+=this.vy;this.vy*=0.9;this.life--;}draw(c){c.globalAlpha=Math.min(1,this.life/10);c.fillStyle=this.color;c.font=`${this.size}px 'Press Start 2P'`;c.fillText(this.text,this.x-c.measureText(this.text).width/2,this.y);c.globalAlpha=1;}}
class Decal{constructor(x,y,color,size){this.x=x;this.y=y;this.color=color;this.size=size;}draw(c){c.globalAlpha=0.6;c.fillStyle=this.color;c.fillRect(this.x,this.y,this.size,this.size);c.globalAlpha=1;}}
class Trap{constructor(x,y){this.x=x;this.y=y;this.w=30;this.h=30;this.state=0;this.timer=Math.random()*100;this.cycle=200;}update(){this.timer++;let m=this.timer%this.cycle;if(m<100)this.state=0;else if(m<140)this.state=1;else this.state=2;}draw(c){if(this.state===0){c.fillStyle='#222';c.fillRect(this.x,this.y,this.w,this.h);}else if(this.state===1){c.fillStyle='#422';c.fillRect(this.x,this.y,this.w,this.h);c.fillStyle='#f00';c.fillRect(this.x+10,this.y+10,10,10);}else{c.fillStyle='#555';c.fillRect(this.x,this.y,this.w,this.h);c.fillStyle='#bbb';c.beginPath();c.moveTo(this.x+5,this.y+25);c.lineTo(this.x+15,this.y+5);c.lineTo(this.x+25,this.y+25);c.fill();}}}

function spawnParticles(x,y,c,count,spd,size=2){if(!CONFIG.particles)return;for(let i=0;i<count;i++){let a=Math.random()*6.28,s=Math.random()*spd;particles.push(new Particle(x,y,c,Math.cos(a)*s,Math.sin(a)*s,20+Math.random()*20,size));}}
function addShake(a){screenShake=Math.min(screenShake+a,20);}

class Player {
    constructor(id, skin, classType) {
        this.id=id; this.skin=skin; this.x=id===1?400:600; this.y=350;
        this.armor=0; this.maxArmor=50; this.w=20; this.h=20;
        this.weapon=WEAPONS.SWORD; this.inventory=['SWORD']; this.weaponLevels={SWORD:1};
        this.weaponEnchants={}; 
        this.relics=[]; this.hasShield=false;
        this.atkTimer=0; this.animTimer=0; this.animMax=0; this.angle=0; this.alive=true;
        this.vx=0; this.vy=0; this.ammo=6; this.reloadTimer=0; this.dashTimer=0; this.dashCd=0; this.isReflecting=false; this.walkCycle=0;
        this.classType = classType; this.dodgeCharges = 3; this.dodgeTimer = 0; this.autoAim = true; this.lockPressed = false; 
        this.abilityTimer = 0; this.abilityMaxCD = 1200; this.abilityActiveTimer = 0; this.abilityMaxDuration = 1200; 
        this.bisonAbilityCD = 0; this.bisonAbilityMaxCD = 900; 
        this.rageMode = 0; this.speedBoost = 0; this.tankAbilityActive = 0; this.burstActive = 0; this.invuln = 0;
        this.actVx = 0; this.actVy = 0;
        this.joyVx = 0; this.joyVy = 0; 

        if(classType === 'WARRIOR') { this.hp=120; this.maxHp=120; }
        if(classType === 'TANK') { this.hp=160; this.maxHp=160; this.armor=40; this.hasShield=true; } 
        if(classType === 'SCOUT') { this.hp=80; this.maxHp=80; }
        if(classType === 'MAGE') { this.hp=100; this.maxHp=100; this.inventory = ['BOW']; this.weapon = WEAPONS.BOW; this.weaponLevels={BOW:1}; } 
        else { this.inventory = ['SWORD']; this.weapon = WEAPONS.SWORD; this.weaponLevels={SWORD:1}; }

        if(gameMode === 'MADMAN') { this.inventory = ['FIST']; this.weapon = WEAPONS.FIST; this.weaponLevels={FIST:1}; } 
        else if(gameMode === 'SANDBOX') { this.hp = 10000; this.maxHp = 10000; this.armor = 1000; this.inventory = Object.keys(WEAPONS).map(k=>k); this.relics = RELICS.map(r=>r.id); this.hasShield = true; this.inventory.forEach(k => this.weaponLevels[k]=5); this.abilityTimer = 0; }
    }
    hasRelic(id) { return this.relics.includes(id); }
    hasEnchant(id) { let list = this.weaponEnchants[this.weapon.name]; return list && list.includes(id); }
}

function activateAbility(p) {
    if(p.abilityActiveTimer > 0 || p.abilityTimer > 0) { floatTexts.push(new FloatText(p.x, p.y-20, "NO LISTO", "#888")); return; }
    p.abilityActiveTimer = p.abilityMaxDuration;
    if(p.id === 1 && purchasedSkills['tr_abil_dur']) p.abilityActiveTimer *= (1 + purchasedSkills['tr_abil_dur'] * 0.10);
    p.abilityActiveTimer = Math.round(p.abilityActiveTimer);
    playSfx('powerup');
    
    if(p.classType === 'WARRIOR') { p.rageMode = p.abilityActiveTimer; floatTexts.push(new FloatText(p.x, p.y-30, "¡FURIA!", "#f00", 20)); spawnParticles(p.x, p.y, '#f00', 30, 6); }
    else if(p.classType === 'SCOUT') { p.dodgeCharges = 3; p.dashCd = 0; p.speedBoost = p.abilityActiveTimer; floatTexts.push(new FloatText(p.x, p.y-30, "¡EVASION!", "#0ff", 20)); spawnParticles(p.x, p.y, '#0ff', 30, 6); }
    else if(p.classType === 'TANK') { let healBase = 30; healBase *= (1 + (purchasedSkills['fo_poti_eff'] || 0) * 0.20); p.hp = Math.min(p.hp+healBase, p.maxHp); p.tankAbilityActive = p.abilityActiveTimer; floatTexts.push(new FloatText(p.x, p.y-30, "¡ESCUDO!", "#0f0", 20)); spawnParticles(p.x, p.y, '#0f0', 30, 6); }
    else if(p.classType === 'MAGE') { p.burstActive = p.abilityActiveTimer; if(p.weapon.maxAmmo) p.ammo = getWeaponStats(p).maxAmmo || 6; enemies.forEach(en => { if(Math.hypot(en.x-p.x, en.y-p.y) < 200) { en.x += Math.cos(Math.atan2(en.y-p.y, en.x-p.x)) * 100; en.y += Math.sin(Math.atan2(en.y-p.y, en.x-p.x)) * 100; applyDamage(en, 30); en.flash=3; } }); floatTexts.push(new FloatText(p.x, p.y-30, "¡RAFAGA!", "#f0f", 20)); spawnParticles(p.x, p.y, '#f0f', 30, 8); }
}

function activateBisonAbility(p) {
    if(p.bisonAbilityCD > 0) { floatTexts.push(new FloatText(p.x, p.y-20, "NO LISTO", "#888")); return; }
    let finalCD = p.bisonAbilityMaxCD;
    if(p.id === 1 && purchasedSkills['tr_abil_cd']) finalCD *= (1 - purchasedSkills['tr_abil_cd'] * 0.05);
    p.bisonAbilityCD = Math.round(finalCD);
    playSfx('explo'); addShake(15); floatTexts.push(new FloatText(p.x, p.y-30, "¡TERREMOTO!", "#f44", 25));
    spawnParticles(p.x, p.y, '#f44', 50, 10, 5); spawnParticles(p.x, p.y, '#631', 30, 8, 4);
    let groundDmg = 250;
    if(p.id === 1 && purchasedSkills['fo_hoarder']) groundDmg *= (1 + Math.min(0.20, gold / 100 * 0.01));
    enemies.forEach(en => { if(Math.hypot(en.x - p.x, en.y - p.y) < 180) { applyDamage(en, groundDmg); en.x += Math.cos(Math.atan2(en.y - p.y, en.x - p.x)) * 30; en.y += Math.sin(Math.atan2(en.y - p.y, en.x - p.x)) * 30; } });
}

function togglePause(){ if(state==='PLAYING'){state='PAUSED';document.getElementById('pause-menu').style.display='flex';}else if(state==='PAUSED'){state='PLAYING';document.getElementById('pause-menu').style.display='none';} }
function gameOver(){ state='GAMEOVER'; document.getElementById('hud').style.display = 'none'; document.getElementById('inventory-hud').style.display = 'none'; localStorage.removeItem('pd_save_data'); document.getElementById('game-over-menu').style.display='flex'; document.querySelector('#game-over-menu h1').innerText = "HAS MUERTO"; document.querySelector('#game-over-menu h1').style.color = "#f00"; if(wave > highScore && gameMode === 'NORMAL') { highScore = wave; localStorage.setItem('pd_highscore', highScore); document.getElementById('death-wave').innerText = wave + " (NUEVO RECORD!)"; showHighScoreInMenu(); } else { document.getElementById('death-wave').innerText = gameMode === 'BOSSRUSH' ? "MODO JEFES FALLIDO" : wave; } document.getElementById('death-gold').innerText=gold; }
function gameOverPvP(winnerId) { pvpScores[winnerId]++; if(pvpRound >= pvpMaxRounds) { state = 'GAMEOVER'; document.getElementById('hud').style.display = 'none'; document.getElementById('inventory-hud').style.display = 'none'; document.getElementById('game-over-menu').style.display = 'flex'; let h1 = document.querySelector('#game-over-menu h1'); let w = (pvpScores[1] > pvpScores[2]) ? 1 : (pvpScores[2] > pvpScores[1] ? 2 : 0); if(w === 0) { h1.innerText = "¡EMPATE GLOBAL!"; h1.style.color = "#fff"; } else { h1.innerText = `¡JUGADOR ${w} GANA EL TORNEO!`; h1.style.color = w === 1 ? "#0af" : "#f44"; } document.getElementById('death-wave').innerText = `${pvpScores[1]} - ${pvpScores[2]}`; document.getElementById('death-gold').style.display = 'none'; } else { pvpRound++; floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, `P${winnerId} GANA LA RONDA!`, "#fe0", 25)); setTimeout(() => { startPvPDraft(winnerId); }, 2000); } }

function startPvPDraft(winnerId) { let loserId = winnerId === 1 ? 2 : 1; pvpDraft = { active: true, turn: winnerId, sequence: [winnerId, loserId], picked: [] }; pvpDraftOptions = []; let keys = Object.keys(WEAPONS).filter(k => k !== 'FIST' && !WEAPONS[k].unique); for(let i=0; i<3; i++) { let k = keys[Math.floor(Math.random() * keys.length)]; pvpDraftOptions.push(WEAPONS[k]); } state = 'DRAFT'; updateDraftUI(); }
function updateDraftUI() { document.getElementById('shop-menu').style.display='flex'; document.getElementById('shop-gold').innerText = `RONDA ${pvpRound}/${pvpMaxRounds} | ${pvpScores[1]} - ${pvpScores[2]}`; document.querySelector('.btn-refresh').style.display = 'none'; const cw = document.getElementById('shop-weapons-rng'); cw.innerHTML=''; document.getElementById('shop-relics-rng').innerHTML = ''; document.getElementById('shop-consumables').innerHTML = ''; document.getElementById('shop-sell').innerHTML = ''; let title = document.createElement('div'); title.style.color = pvpDraft.turn === 1 ? '#0af' : '#f44'; title.style.fontSize = '20px'; title.style.textAlign = 'center'; title.style.marginBottom = '20px'; title.innerText = `TURNO JUGADOR ${pvpDraft.turn}: ELIGE ARMA`; cw.appendChild(title); pvpDraftOptions.forEach((w, idx) => { let disabled = pvpDraft.picked.includes(idx); let d = document.createElement('div'); d.className = 'shop-item'; if(disabled) d.style.opacity = '0.3'; d.innerHTML = `<span>${w.name}</span><span style="color:#fe0">DRAFT</span>`; d.onclick = () => { if(disabled) return; selectPvPWeapon(w, idx); }; cw.appendChild(d); }); }
function selectPvPWeapon(w, idx) { let p = pvpDraft.turn === 1 ? p1 : p2; p.inventory = [getWeaponKeyName(w.id)]; p.weapon = w; p.weaponLevels = {}; p.weaponLevels[getWeaponKeyName(w.id)] = 1; pvpDraft.picked.push(idx); let currentIdx = pvpDraft.sequence.indexOf(pvpDraft.turn); if(currentIdx < pvpDraft.sequence.length - 1) { pvpDraft.turn = pvpDraft.sequence[currentIdx + 1]; updateDraftUI(); } else { state = 'PLAYING'; document.getElementById('shop-menu').style.display='none'; resetPvPStats(); currentBiome = BIOMES[Math.floor(Math.random() * BIOMES.length)]; spawnLevel(); } }

function updateSkillPointsHUD() { document.getElementById('skill-points-hud').innerText = "PUNTOS HABILIDAD: " + skillPoints; document.getElementById('skill-points-reap').innerText = skillPoints; }
function toggleSkillsMenu() { if(gameMode === 'PVP' || gameMode === 'SANDBOX' || gameMode === 'BOSSRUSH') return; const menu = document.getElementById('skills-menu'); if(menu.style.display === 'none') { state = 'SHOP'; menu.style.display = 'flex'; updateSkillTreeVisuals(); playSfx('reload'); } else { state = 'PLAYING'; menu.style.display = 'none'; playSfx('tick'); } }
function setupSkillTreeUI() { const branches = ['prowler', 'brave', 'forager', 'traveler']; branches.forEach(branchName => { const grid = document.getElementById('grid-' + branchName); grid.innerHTML = ''; const skills = SKILL_TREE_DATA[branchName]; skills.forEach(skill => { let node = document.createElement('div'); node.className = 'skill-node locked'; node.id = 'node-' + skill.id; node.style.gridRow = skill.grid[0] + 1; node.style.gridColumn = skill.grid[1] + 1; let icon = document.createElement('div'); icon.className = 'skill-icon-visual'; node.appendChild(icon); if(skill.max > 1) { let badge = document.createElement('div'); badge.className = 'skill-level-badge'; badge.innerText = `0/${skill.max}`; badge.id = 'badge-' + skill.id; node.appendChild(badge); } node.addEventListener('mouseenter', (e) => showSkillTooltip(e, skill)); node.addEventListener('mouseleave', hideSkillTooltip); node.addEventListener('click', () => buySkill(skill)); grid.appendChild(node); }); }); }
function updateSkillTreeVisuals() { updateSkillPointsHUD(); const branches = ['prowler', 'brave', 'forager', 'traveler']; branches.forEach(branchName => { const skills = SKILL_TREE_DATA[branchName]; skills.forEach(skill => { const node = document.getElementById('node-' + skill.id); const badge = document.getElementById('badge-' + skill.id); const level = purchasedSkills[skill.id] || 0; node.className = 'skill-node'; if(level >= skill.max) { node.classList.add('purchased'); } else { let preOk = true; if(skill.req) { const reqSkill = SKILL_TREE_DATA[branchName].find(s => s.id === skill.req); const reqLevel = purchasedSkills[skill.req] || 0; if(reqLevel < 1) preOk = false; } if(preOk && skillPoints >= skill.cost) { node.classList.add('available'); } else { node.classList.add('locked'); } } if(badge) badge.innerText = `${level}/${skill.max}`; }); }); }

const tooltip = document.getElementById('skill-tooltip');
function showSkillTooltip(e, skill) { const node = e.currentTarget; const rect = node.getBoundingClientRect(); tooltip.style.display = 'block'; tooltip.style.top = (rect.top + window.scrollY - tooltip.offsetHeight - 10) + 'px'; tooltip.style.left = (rect.left + window.scrollX + rect.width/2 - tooltip.offsetWidth/2) + 'px'; document.getElementById('st-name').innerText = skill.name; document.getElementById('st-desc').innerText = skill.desc; const level = purchasedSkills[skill.id] || 0; const isPurchased = level >= skill.max; if(isPurchased) { document.getElementById('st-cost').innerText = "Costo: MÁX"; document.getElementById('st-state').innerText = "NIVEL MÁXIMO ALCANZADO"; document.getElementById('st-state').style.color = '#fe0'; } else { document.getElementById('st-cost').innerText = `Costo: ${skill.cost} Puntos`; if(node.classList.contains('available')) { document.getElementById('st-state').innerText = "DISPONIBLE PARA COMPRAR"; document.getElementById('st-state').style.color = '#0f0'; } else { document.getElementById('st-state').innerText = "BLOQUEADO (Requiere Prerreq. o Puntos)"; document.getElementById('st-state').style.color = '#f00'; } } }
function hideSkillTooltip() { tooltip.style.display = 'none'; }
function buySkill(skill) { if(gameMode === 'PVP' || gameMode === 'SANDBOX' || gameMode === 'BOSSRUSH') return; const level = purchasedSkills[skill.id] || 0; if(level >= skill.max) { floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "NIVEL MÁXIMO!", "#888")); return; } if(skillPoints < skill.cost) { playSfx('block'); floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "PUNTOS INSUFICIENTES!", "#f00")); return; } if(skill.req) { let branchName = ""; for(let key in SKILL_TREE_DATA) { if(SKILL_TREE_DATA[key].find(s => s.id === skill.id)) branchName = key; } const reqLevel = purchasedSkills[skill.req] || 0; if(reqLevel < 1) { playSfx('block'); floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "REQUIERE HABILIDAD PREVIA!", "#f00")); return; } } skillPoints -= skill.cost; purchasedSkills[skill.id] = level + 1; playSfx('powerup'); applySkillEffect(skill.id, purchasedSkills[skill.id]); updateSkillTreeVisuals(); hideSkillTooltip(); floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "¡HABILIDAD MEJORADA!", "#fe0", 12)); }
function applySkillEffect(skillId, level) { if(!p1) return; if(skillId === 'br_hp_1') { p1.maxHp += 10; p1.hp += 10; floatTexts.push(new FloatText(p1.x, p1.y-10, "+10 MAX HP", "#0f0")); } }

function spawnLevel() {
    enemies=[]; projectiles=[]; enemyBullets=[]; structures=[]; warnings=[]; particles=[]; floatTexts=[]; decals=[]; traps=[];
    spawnQueue = []; 

    if(gameMode === 'BOSSRUSH') {
        if(brSelectedBoss === 'SKELETON') currentBiome = BIOMES[0]; else if(brSelectedBoss === 'GOLEM') currentBiome = BIOMES[1]; else if(brSelectedBoss === 'DEMON') currentBiome = BIOMES[2]; else currentBiome = BIOMES[3]; 
        document.getElementById('biome-txt').innerText = `JEFE: ${brSelectedBoss}`; document.getElementById('diff-txt').innerText = `PODER: ${Math.round(enemyPower*100)}%`; playBossMusic(5); 

        if(brSelectedBoss === 'AI_BOSS') {
            if (!isMobile) showBossAlert("¡Clon de sombra DESPIERTA!");
            enemies.push({ x: GAME_W/2, y: 100, w: 20, h: 20, hp: 8000 * enemyPower, maxHp: 8000 * enemyPower, speed: 3.15, color: '#222', type: 'AI_BOSS', flash: 0, cd: 0, dashCd: 0, walkCycle: 0, animOffset: {x:0,y:0} });
        } else {
            let bColor = '#ccc'; if(brSelectedBoss === 'GOLEM') bColor = '#642'; if(brSelectedBoss === 'DEMON') bColor = '#f00';
            if (!isMobile) showBossAlert("¡PREPÁRATE!");
            enemies.push({ x:GAME_W/2,y:100,w:60,h:60, hp: 4000 * enemyPower, maxHp: 4000 * enemyPower, speed:1.5, color: bColor, type:'BOSS', bossSubType: brSelectedBoss, flash:0, abilityTimer:400, abilityMax:400, walkCycle:0, animOffset:{x:0,y:0}, atkState:0, atkRange:120, atkWindup:25, atkDuration:25, reload:50, hasSpecialAtk: false });
        }
        return; 
    }
    
    if(gameMode === 'PVP') {
        document.getElementById('biome-txt').innerText = `PVP: ${currentBiome.name}`; document.getElementById('diff-txt').innerText = `RONDA ${pvpRound}/${pvpMaxRounds}`;
        for(let i=0; i<12; i++) { let cx = 100 + Math.random()*(GAME_W-200); let cy = 100 + Math.random()*(GAME_H-200); let type = Math.floor(Math.random()*3); if(type===0) { structures.push({x:cx, y:cy, w:60, h:60}); } else if(type===1) { structures.push({x:cx, y:cy, w:30, h:100}); structures.push({x:cx, y:cy+70, w:80, h:30}); } else { structures.push({x:cx+30, y:cy, w:30, h:100}); structures.push({x:cx, y:cy+30, w:90, h:30}); } }
        return; 
    }

    currentBiome=BIOMES[Math.floor((wave-1)/5)%BIOMES.length]; document.getElementById('biome-txt').innerText=currentBiome.name; enemyPower=1+(wave*0.08); document.getElementById('diff-txt').innerText="PODER ENEMIGO: "+Math.round(enemyPower*100)+"%";
    startMission();

    if(wave === 20) {
        playBossMusic(wave); if (!isMobile) showBossAlert("¡Clon de sombra DESPIERTA!");
        enemies.push({ x: GAME_W/2, y: 100, w: 20, h: 20, hp: 8000 * enemyPower, maxHp: 8000 * enemyPower, speed: 3.15, color: '#222', type: 'AI_BOSS', flash: 0, cd: 0, dashCd: 0, walkCycle: 0, animOffset: {x:0,y:0} });
    } else if(wave % 5 === 0) {
        playBossMusic(wave); 
        if (!isMobile) {
            document.getElementById('boss-alert').style.display='block'; setTimeout(()=>document.getElementById('boss-alert').style.display='none', 2000);
        }
        enemies.push({ x:GAME_W/2,y:100,w:60,h:60, hp:(2000+wave*250)*enemyPower,maxHp:(2000+wave*250)*enemyPower, speed:1.5,color:currentBiome.bossColor, type:'BOSS',bossSubType:currentBiome.bossType, flash:0,abilityTimer:400,abilityMax:400,walkCycle:0, animOffset:{x:0,y:0}, atkState:0, atkRange:120, atkWindup:25, atkDuration:25, reload:50, hasSpecialAtk: false });
    } else {
        let total = (isCoop?6:5)+Math.floor(wave*1.5); let rawEnemies = [];
        for(let i=0; i<total; i++) {
            let type = 'GRUNT'; let priority = 2; let rnd = Math.random();
            if(rnd < 0.1) { type='GRUNT'; priority=0; } else if(rnd < 0.3) { type='TANK'; priority=1; } else if(rnd < 0.6) { type='SHOOTER'; priority=3; }
            let s = getEnemyStats(type); let isElite = (priority === 0); let hp = s.hp * enemyPower * (isElite?2.5:1);
            rawEnemies.push({ def: { x: Math.random()*GAME_W, y: Math.random()<0.5?-50:GAME_H+50, w: s.size*(isElite?1.5:1), h: s.size*(isElite?1.5:1), hp: hp, maxHp: hp, speed: s.speed, color: isElite?'#fff':s.color, type: type, flash: 0, walkCycle: 0, elite: isElite, range: s.range || 350, reload: s.reload || 120, cd:Math.random()*100, atkTimer: 0, atkState: 0, atkRange: s.atkRange, atkWindup: s.atkWindup, atkDuration: s.atkDuration, animOffset: {x:0, y:0} }, prio: priority });
        }
        rawEnemies.sort((a,b) => a.prio - b.prio); spawnQueue = rawEnemies.map(e => e.def);
    }
    
    if(gameMode === 'SANDBOX') { spawnQueue = []; enemies.push({x:500,y:200,w:30,h:30,hp:10000,maxHp:10000,speed:1.35,color:'#888',type:'DUMMY',flash:0,range:200,reload:60,cd:0,walkCycle:0, animOffset:{x:0,y:0}}); return; }

    let safe=150, att=0;
    function isClear(rect, others) { if(Math.hypot(rect.x+rect.w/2-GAME_W/2, rect.y+rect.h/2-GAME_H/2) < safe) return false; if(rect.x<50||rect.x+rect.w>GAME_W-50||rect.y<50||rect.y+rect.h>GAME_H-50) return false; for(let s of others) { if(rect.x<s.x+s.w+40 && rect.x+rect.w+40>s.x && rect.y<s.y+s.h+40 && rect.y+rect.h+40>s.y) return false; } return true; }

    while(structures.length<15 && att<200){
        att++; let cx=100+Math.random()*(GAME_W-200), cy=100+Math.random()*(GAME_H-200); let type=Math.floor(Math.random()*4); let sList = [];
        if(type===0) { sList.push({x:cx,y:cy,w:50,h:50}); } else if(type===1) { sList.push({x:cx,y:cy,w:30,h:90}); sList.push({x:cx+30,y:cy+60,w:50,h:30}); } else if(type===2) { sList.push({x:cx,y:cy,w:90,h:30}); sList.push({x:cx+30,y:cy+30,w:30,h:60}); } else { sList.push({x:cx,y:cy,w:30,h:120}); sList.push({x:cx+80,y:cy,w:30,h:120}); }
        let valid = true; for(let part of sList) { if(!isClear(part, structures)) valid=false; } if(valid) { sList.forEach(s=>structures.push(s)); }
    }
    if(wave%5===0 && wave!==0) { for(let i=0; i<10; i++) traps.push(new Trap(100+Math.random()*(GAME_W-200), 100+Math.random()*(GAME_H-200))); }
}

function spawnCoin() { decals.push({x: 50+Math.random()*(GAME_W-100), y: 50+Math.random()*(GAME_H-100), color:'#fe0', size:10, type:'COIN'}); }

function getEnemyStats(t){
    switch(t){
        case 'TANK': return{hp:200,speed:1,size:30,color:'#522', atkRange:50, atkWindup:40, atkDuration:20, reload:120};
        case 'SPEED': return{hp:50,speed:2.5,size:15,color:'#dd0', atkRange:40, atkWindup:15, atkDuration:10, reload:40};
        case 'SHOOTER': return{hp:70,speed:1.5,size:20,color:'#a0a', range:350, reload:120};
        default: return{hp:100,speed:1.8,size:20,color:'#383', atkRange:35, atkWindup:25, atkDuration:15, reload:80};
    }
}

function getWeaponStats(p){
    let b=p.weapon,l=p.weaponLevels[b.name]||1; 
    let dmgMult = 1.0; let cdMult = 1.0; let rngMult = 1.0; let finalMaxAmmo = b.maxAmmo || 0; let recoilMult = 1.0;
    
    if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && gameMode !== 'BOSSRUSH') {
         if(purchasedSkills['pr_dmg_1']) dmgMult *= (1 + purchasedSkills['pr_dmg_1'] * 0.05);
         if(purchasedSkills['pr_spd_1']) cdMult *= (1 - purchasedSkills['pr_spd_1'] * 0.03);
         if(purchasedSkills['fo_ammo_max'] && finalMaxAmmo > 0) finalMaxAmmo += purchasedSkills['fo_ammo_max'] * 2;
    }

    if(p.hasRelic('rage') && (p.hp/p.maxHp < 0.5)) dmgMult += 0.20; 
    if(p.hasRelic('glass')) dmgMult += 0.4; 
    if(p.hasEnchant('sharp')) dmgMult += 0.25;
    
    if(p.classType === 'WARRIOR') { let missing10 = Math.floor((1 - (p.hp / p.maxHp)) * 10); if(missing10 > 0) dmgMult += (missing10 * 0.10); }
    if(p.classType === 'MAGE' && b.type === 'melee') dmgMult -= 0.10;
    if(p.rageMode > 0) dmgMult *= 2.0;
    if(p.burstActive > 0) dmgMult *= 1.25;
    if(p.classType === 'MAGE') { if(b.type === 'ranged') { dmgMult *= 1.10; cdMult *= 0.90; } }
    if(p.hasEnchant('haste')) cdMult -= 0.15;
    if(p.hasEnchant('sniper')) rngMult += 0.3;
    if(p.hasEnchant('heavy')) recoilMult = 1.5;
    if(b.maxAmmo && p.hasEnchant('ammo')) finalMaxAmmo += 3;

    return {...b, dmg:b.dmg*(1+(l-1)*0.15)*dmgMult, cd:(b.cd*Math.pow(0.95,l-1))*cdMult, range: b.range * rngMult, recoil: b.recoil * recoilMult, maxAmmo: finalMaxAmmo, level:l };
}

function resolveCollisions(e,nx,ny){
    e.x=nx; e.y=ny;
    let sl = structures.length;
    for(let i=0; i<sl; i++) {
        let s = structures[i];
        if(e.x<s.x+s.w&&e.x+e.w>s.x&&e.y<s.y+s.h&&e.y+e.h>s.y){
            let l=(e.x+e.w)-s.x,r=(s.x+s.w)-e.x,t=(e.y+e.h)-s.y,b=(s.y+s.h)-e.y,m=Math.min(l,r,t,b);
            if(m===l)e.x-=l;else if(m===r)e.x+=r;else if(m===t)e.y-=t;else if(m===b)e.y+=b;
        }
    }
    
    if(e.type && e.type !== 'PROJECTILE') {
        let el = enemies.length;
        for(let j=0; j<el; j++) {
            let other = enemies[j];
            if(other !== e) {
                let distSq = (e.x - other.x)**2 + (e.y - other.y)**2;
                if(distSq < 400) { 
                    let ang = Math.atan2(e.y - other.y, e.x - other.x); 
                    e.x += Math.cos(ang) * 1.5; e.y += Math.sin(ang) * 1.5; 
                }
            }
        }
        [p1, p2].forEach(p => { 
            if(p.alive) {
                let distSq = (e.x - p.x)**2 + (e.y - p.y)**2;
                if(distSq < 324) { 
                    let ang = Math.atan2(e.y - p.y, e.x - p.x); 
                    e.x += Math.cos(ang) * 2; e.y += Math.sin(ang) * 2; 
                }
            }
        });
    }
    e.x=Math.max(0,Math.min(GAME_W-e.w,e.x));e.y=Math.max(0,Math.min(GAME_H-e.h,e.y));
}

function applyDamage(target, dmgAmount) {
    if(!target.alive) return;
    let dr = 0;
    if(target.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX') { if(purchasedSkills['br_last_st'] && (target.hp / target.maxHp) < 0.25) dr += 0.30; }
    if(target.tankAbilityActive && target.tankAbilityActive > 0) { let baseDR = 0.50; if(target.id === 1 && purchasedSkills['br_shld_eff']) baseDR += purchasedSkills['br_shld_eff'] * 0.10; dr += Math.min(0.95, baseDR); }
    if(target.classType === 'TANK' && (target.hp / target.maxHp) <= 0.25) dr += 0.25;
    
    let finalDmg = dmgAmount * (1 - Math.min(0.95, dr));
    let pArmor = target.armor + (target.hasEnchant('tank') ? 20 : 0);
    if(pArmor > 0) { target.armor = Math.max(0, target.armor - finalDmg); } else { target.hp -= finalDmg; }
    
    floatTexts.push(new FloatText(target.x+10, target.y, "-"+Math.floor(finalDmg), '#f00')); addShake(4); checkMission('damage');
    
    if(navigator.vibrate) navigator.vibrate(50);
    
    if(target.hp <= 0 && target.alive && target.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX') {
         if(purchasedSkills['br_immortal'] && !target.hasImmortalTrig) {
              target.hasImmortalTrig = true; target.hp = Math.round(target.maxHp * 0.25);
              floatTexts.push(new FloatText(target.x, target.y-30, "¡INMORTALIDAD ACTIVADA!", "#fe0", 15));
              spawnParticles(target.x, target.y, '#fe0', 30, 5, 3); playSfx('powerup'); target.alive = true; return; 
         }
    }
    if(target.hp <= 0) target.alive = false;
}

function update() {
    if(state!=='PLAYING' && state !== 'MENU' && state !== 'DRAFT')return; 
    gameTick++; 
    if(gameTick % 10 === 0) updateMusicPlayerUI();
    if(state === 'MENU' || state === 'SHOP' || state === 'ENCHANT') return; 
    if(screenShake>0){screenShake*=0.9;if(screenShake<0.5)screenShake=0;}

    if(spawnQueue.length > 0 && gameTick % 60 === 0) { enemies.push(spawnQueue.shift()); spawnParticles(enemies[enemies.length-1].x+10, enemies[enemies.length-1].y+10, '#fff', 10, 2); }
    if(gameMode === 'MADMAN' && gameTick % 60 === 0) { madmanTimer--; document.getElementById('madman-timer').innerText = "TIEMPO: " + Math.ceil(madmanTimer/60); if(madmanTimer <= 0) gameOver(); }

    for(let i=particles.length-1;i>=0;i--){particles[i].update();if(particles[i].life<=0)particles.splice(i,1);}
    for(let i=floatTexts.length-1;i>=0;i--){floatTexts[i].update();if(floatTexts[i].life<=0)floatTexts.splice(i,1);}
    for(let i=warnings.length-1;i>=0;i--){warnings[i].life--;if(warnings[i].life<=0)warnings.splice(i,1);}
    traps.forEach(tr => tr.update());

    [p1,p2].forEach(p=>{
        if(!p.alive)return;
        if(p.bisonAbilityCD > 0) p.bisonAbilityCD--;
        if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX') { if(purchasedSkills['br_regen'] && gameTick % 600 === 0 && p.hp < p.maxHp) { p.hp = Math.min(p.hp + 1, p.maxHp); floatTexts.push(new FloatText(p.x, p.y-10, "+1 HP", "#0f0", 8)); } }
        if(p.abilityActiveTimer > 0) {
            p.abilityActiveTimer--;
            if(p.abilityActiveTimer === 0) { let finalCD = p.abilityMaxCD; if(p.id === 1 && purchasedSkills['tr_abil_cd']) { finalCD *= (1 - purchasedSkills['tr_abil_cd'] * 0.05); } p.abilityTimer = Math.round(finalCD); floatTexts.push(new FloatText(p.x, p.y-20, "CD HABILIDAD", "#aaa")); }
        } else if(p.abilityTimer > 0) { p.abilityTimer--; if(p.abilityTimer === 0) { floatTexts.push(new FloatText(p.x, p.y-20, "HABILIDAD LISTA", "#fe0")); playSfx('coin'); } }
        
        if(p.rageMode > 0) p.rageMode--; if(p.speedBoost > 0) p.speedBoost--; if(p.tankAbilityActive > 0) p.tankAbilityActive--; if(p.burstActive > 0) p.burstActive--; if(p.invuln > 0) p.invuln--;
        if(gameMode === 'SANDBOX') { p.hp = p.maxHp; p.armor = 1000; p.abilityTimer=0;}
        if(p.hasRelic('dodge') && p.dodgeCharges <= 0) { p.dodgeTimer--; if(p.dodgeTimer <= 0) { p.dodgeCharges = 3; floatTexts.push(new FloatText(p.x, p.y-20, "ESQUIVE LISTO", "#0ff")); playSfx('reload'); } }
        if(p.hasRelic('regen') && gameTick % 300 === 0 && p.hp < p.maxHp) { p.hp = Math.min(p.hp+1, p.maxHp); floatTexts.push(new FloatText(p.x, p.y-10, "+1", "#0f0")); }
        
        p.vx*=0.8;p.vy*=0.8;
        let dx=0,dy=0;
        let baseSpd = 3.0;
        
        if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX') { if(purchasedSkills['tr_spd_1']) baseSpd *= (1 + purchasedSkills['tr_spd_1'] * 0.05); if(purchasedSkills['pr_master'] && currentMission && !currentMission.failed && currentMission.type === 'no_hit') { baseSpd *= 1.10; } }
        if(p.hasRelic('speed')) baseSpd *= 1.15; if(p.classType === 'SCOUT') baseSpd *= 1.15; if(p.classType === 'TANK') baseSpd *= 0.85; if(p.hasEnchant('feather')) baseSpd *= 1.1; if(p.speedBoost > 0) baseSpd *= 1.5;

        let up,down,left,right,atk,dash,shield,special,lock,skills;
        if(p.id===1){
            up=keys[KEYBINDS.p1_up];down=keys[KEYBINDS.p1_down];left=keys[KEYBINDS.p1_left];right=keys[KEYBINDS.p1_right];atk=keys[KEYBINDS.p1_atk];dash=keys[KEYBINDS.p1_dash];shield=keys[KEYBINDS.p1_shield]; special=keys[KEYBINDS.p1_special]; lock=keys[KEYBINDS.p1_lock]; skills=keys[KEYBINDS.p1_skills];
            ['1','2','3','4','5'].forEach(k=>{if(keys[k])switchWeapon(p,parseInt(k));}); 
            
            if(joyActive) {
                let intensity = Math.min(joyDist, 50) / 50; 
                dx = Math.cos(joyAngle) * baseSpd * intensity;
                dy = Math.sin(joyAngle) * baseSpd * intensity;
                p.joyVx = dx; p.joyVy = dy;
            } else {
                if(up)dy-=baseSpd;if(down)dy+=baseSpd;if(left)dx-=baseSpd;if(right)dx+=baseSpd;
                p.joyVx = 0; p.joyVy = 0;
            }
        } else {
            up=keys[KEYBINDS.p2_up];down=keys[KEYBINDS.p2_down];left=keys[KEYBINDS.p2_left];right=keys[KEYBINDS.p2_right];atk=keys[KEYBINDS.p2_atk];dash=keys[KEYBINDS.p2_dash];shield=keys[KEYBINDS.p2_shield]; special=keys[KEYBINDS.p2_special]; lock=keys[KEYBINDS.p2_lock];
            if(up)dy-=baseSpd;if(down)dy+=baseSpd;if(left)dx-=baseSpd;if(right)dx+=baseSpd;
        }

        if(skills && p.id === 1 && !p.skillsPressed) { toggleSkillsMenu(); p.skillsPressed = true; }
        if(!skills) p.skillsPressed = false;

        if(lock && !p.lockPressed) { p.autoAim = !p.autoAim; p.lockPressed = true; let status = p.autoAim ? "AUTO: ON" : "AUTO: OFF"; let col = p.autoAim ? "#0f0" : "#f00"; floatTexts.push(new FloatText(p.x, p.y - 30, status, col, 12)); playSfx('tick'); }
        if(!lock) p.lockPressed = false;

        if(p.reloadTimer>0){p.reloadTimer -= (p.hasRelic('ammo')?2:1); if(p.reloadTimer<=0){p.ammo=getWeaponStats(p).maxAmmo||6;playSfx('reload');}}

        if(dash&&p.dashCd<=0){
            p.dashTimer=15;p.dashCd=150;
            if(p.id === 1 && purchasedSkills['pr_dash_cd']) { p.dashCd *= (1 - purchasedSkills['pr_dash_cd'] * 0.10); }
            p.dashCd = Math.round(p.dashCd);
            playSfx('dash');let ma=(dx===0&&dy===0)?p.angle:Math.atan2(dy,dx);if(dx!==0||dy!==0)ma=Math.atan2(dy,dx);p.vx=Math.cos(ma)*15;p.vy=Math.sin(ma)*15;spawnParticles(p.x+p.w/2,p.y+p.h/2,'#fff',5,1);}
        
        if(p.dashTimer>0){p.dashTimer--;if(gameTick%3===0)spawnParticles(p.x,p.y,p.skin.body,1,0,2);} if(p.dashCd>0)p.dashCd--;
        if(p.dashTimer<=0){if(dx!==0||dy!==0)p.walkCycle+=0.2;else p.walkCycle=0;}
        
        if(special) { if(p.weapon.name === 'BISONTE') activateBisonAbility(p); else activateAbility(p); }

        if(p.hasShield && shield) { p.isReflecting=true; dx*=0.5; dy*=0.5; } else { p.isReflecting=false; }

        let tg = null;
        if(p.autoAim) { if(gameMode === 'PVP') { tg = (p.id === 1) ? p2 : p1; if(!tg.alive) tg = null; } else { tg=getNearestEnemy(p); } }
        
        if(tg) { p.angle=Math.atan2((tg.y+tg.h/2)-(p.y+p.h/2),(tg.x+tg.w/2)-(p.x+p.w/2)); } else if(dx!==0||dy!==0) { p.angle=Math.atan2(dy,dx); }
        
        p.actVx = dx + p.vx; p.actVy = dy + p.vy;
        resolveCollisions(p,p.x+dx+p.vx,p.y+dy+p.vy);
        
        traps.forEach(tr => {
            let trapDmg = 10; if(p.id === 1 && purchasedSkills['tr_trap_vis']) trapDmg = 5;
            if(tr.state===2 && Math.hypot((tr.x+15)-(p.x+10), (tr.y+15)-(p.y+10)) < 20) {
                 if(p.dashTimer>0) return;
                 if(p.hasRelic('dodge') && p.dodgeCharges > 0) { if(gameTick%30===0){ p.dodgeCharges--; if(p.dodgeCharges<=0) p.dodgeTimer=600; floatTexts.push(new FloatText(p.x, p.y-10, "ESQUIVA TRAMPA!", "#0ff", 8)); } } 
                 else if(gameTick%30===0) { applyDamage(p, trapDmg); playSfx('hit'); }
            }
        });

        if(p.atkTimer>0)p.atkTimer--; if(p.animTimer>0)p.animTimer--;
        if(atk) performAttack(p);
    });

    enemies.forEach((en, idx)=>{
        if(en.type === 'DUMMY') { en.hp = en.maxHp; if(!sandboxBotAggro) return; }

        let t=isCoop?(p1.alive&&p2.alive?(Math.hypot(p1.x-en.x,p1.y-en.y)<Math.hypot(p2.x-en.x,p2.y-en.y)?p1:p2):(p1.alive?p1:p2)):p1;
        
        if(t&&t.alive){
            if(en.type==='BOSS') processBossAbilities(en,t);
            let cx=en.x+en.w/2, cy=en.y+en.h/2, tx=t.x+t.w/2, ty=t.y+t.h/2;
            let dist=Math.hypot(tx-cx,ty-cy); let ang = Math.atan2(ty - cy, tx - cx);

            if (en.type === 'AI_BOSS') {
                if (en.currentAng === undefined) en.currentAng = ang;
                let angDiff = ang - en.currentAng;
                while (angDiff > Math.PI) angDiff -= 2 * Math.PI;
                while (angDiff < -Math.PI) angDiff += 2 * Math.PI;
                en.currentAng += angDiff * 0.05; 
                ang = en.currentAng; 

                if (!en.ai) { en.ai = { state: 'CHASE', timer: 0, enraged: false, chargeAng: 0 }; en.currentWeapon = WEAPONS.BISONTE; }

                if (en.hp / en.maxHp <= 0.3 && !en.ai.enraged) {
                    en.ai.enraged = true; en.speed *= 1.5; en.w += 10; en.h += 10; en.color = '#f00';
                    floatTexts.push(new FloatText(cx, cy-40, "¡BERSERKER!", "#f00", 25)); playSfx('boss'); addShake(20); spawnParticles(cx, cy, '#f00', 50, 10);
                }

                if (en.ai.enraged && gameTick % 5 === 0) spawnParticles(cx, cy, '#f50', 1, 0, 3); 

                if (en.ai.state === 'CHASE') {
                    en.ai.timer++;
                    let edx = Math.cos(ang) * en.speed; let edy = Math.sin(ang) * en.speed;
                    resolveCollisions(en, en.x+edx, en.y+edy); en.walkCycle += en.speed * 0.2;

                    if (en.cd <= 0 && dist < 65) {
                        en.cd = 80; playSfx('swing'); en.animOffset.x = Math.cos(ang) * 30; en.animOffset.y = Math.sin(ang) * 30;
                        setTimeout(() => { en.animOffset = {x:0,y:0}; }, 150); if (dist < 100) applyDamage(t, 80 * enemyPower);
                    }
                    if (en.cd > 0) en.cd--;

                    if (en.ai.timer > (en.ai.enraged ? 160 : 240)) {
                        en.ai.timer = 0; let rnd = Math.random();
                        if (rnd < 0.4) { en.ai.state = 'CHARGE_WINDUP'; en.ai.timer = 60; en.ai.chargeAng = ang; playSfx('reload'); warnings.push({x: tx, y: ty, r: 50, life: 60}); } 
                        else if (rnd < 0.7) { en.ai.state = 'PULL'; en.ai.timer = 60; playSfx('enchant'); floatTexts.push(new FloatText(cx, cy-20, "¡ATRACCIÓN!", "#0af", 15)); } 
                        else { en.ai.state = 'STOMP_WINDUP'; en.ai.timer = 45; warnings.push({x: cx, y: cy, r: 150, life: 45}); }
                    }
                } 
                else if (en.ai.state === 'CHARGE_WINDUP') {
                    en.ai.timer--; en.animOffset.x = (Math.random()-0.5)*10; en.animOffset.y = (Math.random()-0.5)*10;
                    let toTargetAng = Math.atan2(ty - cy, tx - cx); en.ai.chargeAng += (toTargetAng - en.ai.chargeAng) * 0.1;
                    if (en.ai.timer <= 0) { en.ai.state = 'CHARGING'; en.ai.timer = 20; playSfx('dash'); floatTexts.push(new FloatText(cx, cy-20, "¡EMBESTIDA!", "#f00", 15)); }
                }
                else if (en.ai.state === 'CHARGING') {
                    en.ai.timer--; let dashSpd = en.ai.enraged ? 22.5 : 18; en.x += Math.cos(en.ai.chargeAng) * dashSpd; en.y += Math.sin(en.ai.chargeAng) * dashSpd; spawnParticles(cx, cy, '#555', 5, 2);
                    if (dist < 60) { applyDamage(t, 120 * enemyPower); t.x += Math.cos(en.ai.chargeAng) * 100; t.y += Math.sin(en.ai.chargeAng) * 100; en.ai.state = 'CHASE'; en.ai.timer = 0; en.cd = 80; addShake(15); }
                    if (en.ai.timer <= 0) { en.ai.state = 'CHASE'; en.ai.timer = 0; en.cd = 50; }
                }
                else if (en.ai.state === 'PULL') {
                    en.ai.timer--;
                    if (dist < 400) { t.x -= Math.cos(ang) * (en.ai.enraged ? 7.2 : 4.5); t.y -= Math.sin(ang) * (en.ai.enraged ? 7.2 : 4.5); spawnParticles(tx, ty, '#0af', 1, 5, 2); }
                    if (en.ai.timer <= 0) { en.ai.state = 'STOMP_WINDUP'; en.ai.timer = 20; warnings.push({x: cx, y: cy, r: 180, life: 20}); }
                }
                else if (en.ai.state === 'STOMP_WINDUP') {
                    en.ai.timer--; en.animOffset.y = -10; 
                    if (en.ai.timer <= 0) {
                        playSfx('explo'); addShake(20); spawnParticles(cx, cy, '#f44', 50, 10, 5); spawnParticles(cx, cy, '#631', 30, 8, 4);
                        if (dist < 180) { applyDamage(t, 150 * enemyPower); t.x += Math.cos(ang) * 50; t.y += Math.sin(ang) * 50; }
                        en.ai.state = 'CHASE'; en.ai.timer = 0; en.cd = 80; en.animOffset.y = 0;
                    }
                }
            }
            else if(en.type === 'SHOOTER'){
                if(en.cd>0)en.cd--;
                if(dist < en.range - 100) { ang += Math.PI; } else if(dist < en.range) { ang += Math.PI/2; } 
                if(en.cd<=0 && dist < en.range + 50){
                    let shootAng = Math.atan2(ty - cy, tx - cx); enemyBullets.push({x:cx,y:cy,vx:Math.cos(shootAng)*5,vy:Math.sin(shootAng)*5,size:6,dmg:15*enemyPower}); en.cd = en.reload || 120; playSfx('shoot'); en.x -= Math.cos(shootAng)*5; en.y -= Math.sin(shootAng)*5;
                }
                let edx = Math.cos(ang) * en.speed; let edy = Math.sin(ang) * en.speed; resolveCollisions(en, en.x+edx, en.y+edy); en.walkCycle+=en.speed*0.2;
            } else {
                if(en.cd > 0) en.cd--;
                if(en.atkState === 0) { 
                    if(dist <= en.atkRange && en.cd <= 0) { en.atkState = 1; en.atkTimer = en.atkWindup; playSfx('reload'); } 
                    else { let edx = Math.cos(ang) * en.speed; let edy = Math.sin(ang) * en.speed; resolveCollisions(en, en.x+edx, en.y+edy); en.walkCycle+=en.speed*0.2; }
                } 
                else if(en.atkState === 1) { 
                    en.atkTimer--; en.animOffset.x = Math.cos(ang + Math.PI) * 5; en.animOffset.y = Math.sin(ang + Math.PI) * 5;
                    if(en.atkTimer <= 0) { en.atkState = 2; en.atkTimer = en.atkDuration; playSfx('swing'); let lungeDist = 20; en.animOffset.x = Math.cos(ang) * lungeDist; en.animOffset.y = Math.sin(ang) * lungeDist; }
                }
                else if(en.atkState === 2) { 
                    en.atkTimer--; let hitX = en.x + en.w/2 + en.animOffset.x; let hitY = en.y + en.h/2 + en.animOffset.y; let hitRadius = 25;
                    if(Math.hypot(tx - hitX, ty - hitY) < hitRadius) {
                        if(t.dashTimer>0 || t.invuln > 0){} 
                        else if(t.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && purchasedSkills['tr_dodge'] && Math.random() < purchasedSkills['tr_dodge'] * 0.03) { floatTexts.push(new FloatText(t.x, t.y-10, "ESQUIVADO!", "#0ff", 8)); playSfx('dash'); spawnParticles(t.x, t.y, '#0ff', 5, 2); }
                        else if(t.isReflecting && Math.abs(ang - (t.angle+Math.PI)) > 1.0) { playSfx('block'); spawnParticles(hitX,hitY,'#4af',10,3); en.cd = 60; } 
                        else {
                            if(t.hasRelic('dodge') && t.dodgeCharges > 0) { t.dodgeCharges--; if(t.dodgeCharges<=0) t.dodgeTimer=600; floatTexts.push(new FloatText(t.x, t.y-10, "ESQUIVA RELIQUIA!", "#0ff", 8)); playSfx('dash'); } 
                            else { let dmg=(en.type==='TANK'?20:(en.type==='BOSS'?40:10))*enemyPower; applyDamage(t, dmg); if(t.hasRelic('thorns') || (t.id === 1 && purchasedSkills['br_thorns'])){ let refMult = t.hasRelic('thorns') ? 0.15 : 0; if(t.id === 1 && purchasedSkills['br_thorns']) refMult += purchasedSkills['br_thorns'] * 0.15; let refDmg = dmg * refMult; en.hp-=refDmg; floatTexts.push(new FloatText(en.x,en.y,Math.floor(refDmg),"#eee", 8)); } }
                        }
                        en.atkState = 3; en.cd = en.reload || 80;
                    }
                    if(en.atkTimer <= 0) { en.atkState = 3; en.cd = en.reload || 80; }
                }
                else if(en.atkState === 3) { en.animOffset.x *= 0.8; en.animOffset.y *= 0.8; if(en.cd < (en.reload - 20)) en.atkState = 0; }
            }
        }
        if(en.flash>0)en.flash--;
    });

    projectiles.forEach((b,i)=>{
        b.x+=b.vx;b.y+=b.vy;let hit=false;
        structures.forEach(st=>{if(b.x>st.x&&b.x<st.x+st.w&&b.y>st.y&&b.y<st.y+st.h){hit=true;spawnParticles(b.x,b.y,'#aaa',5,2);}});
        if(b.x<0||b.x>GAME_W||b.y<0||b.y>GAME_H) hit=true;

        if(gameMode === 'PVP' && b.owner) {
            let target = (b.owner.id === 1) ? p2 : p1;
            if(target.alive && !hit && b.x > target.x && b.x < target.x + target.w && b.y > target.y && b.y < target.y + target.h) {
                if(target.isReflecting) { b.dmg *= 0.4; playSfx('block'); }
                let dmg = b.dmg; dmg = Math.max(1, Math.floor(dmg * 0.5)); applyDamage(target, dmg); target.flash = 3; spawnParticles(b.x, b.y, '#f00', 8, 4); hit = true; if(!b.pierce) projectiles.splice(i,1); if(target.hp <= 0) { setTimeout(() => gameOverPvP(b.owner.id), 500); }
            }
        }

        enemies.forEach((en,j)=>{
            if(!hit&&b.x>en.x&&b.x<en.x+en.w&&b.y>en.y&&b.y<en.y+en.h){
                let dmg=b.dmg; en.hp-=dmg; en.flash=3; let txtCol = b.isCrit ? '#f80' : '#ff0'; let txtSz = b.isCrit ? 16 : 10;
                floatTexts.push(new FloatText(en.x+en.w/2,en.y,Math.floor(dmg),txtCol,txtSz)); spawnParticles(b.x,b.y,en.color || '#fff',8,4);
                
                if(b.owner) {
                    if(b.owner.hasEnchant('vampire') && Math.random() < 0.05) { b.owner.hp = Math.min(b.owner.hp+5, b.owner.maxHp); floatTexts.push(new FloatText(b.owner.x, b.owner.y-20, "VAMPIRO ENCH.", "#f00", 8)); }
                    if(b.owner.hasEnchant('thunder') && Math.random() < 0.2) b.lightning = true; if(b.owner.hasEnchant('explosive') && Math.random() < 0.1) b.explosive = true;
                }

                if(b.lightning) { enemies.forEach(subEn => { if(subEn!==en && Math.hypot(subEn.x-en.x, subEn.y-en.y) < 150) { subEn.hp -= dmg/2; subEn.flash=3; floatTexts.push(new FloatText(subEn.x+subEn.w/2,subEn.y,Math.floor(dmg/2),'#0af', 8)); ctx.strokeStyle='#0ff'; ctx.beginPath(); ctx.moveTo(en.x+en.w/2,en.y+en.h/2); ctx.lineTo(subEn.x+subEn.w/2,subEn.y+subEn.h/2); ctx.stroke(); } }); }
                if(b.explosive){playSfx('explo');addShake(5);spawnParticles(b.x,b.y,'#f50',20,6,4);enemies.forEach(se=>{if(Math.hypot(se.x-b.x,se.y-b.y)<100){se.hp-=b.dmg/2;floatTexts.push(new FloatText(se.x+se.w/2,se.y,Math.floor(b.dmg/2),'#f80', 8));}});}
                en.x+=b.vx*0.5;en.y+=b.vy*0.5; if(!b.pierce){projectiles.splice(i,1);hit=true;}
                if(en.hp<=0 && !en.dead){
                    en.dead = true; 
                    if((en.type === 'BOSS' || en.type === 'AI_BOSS') && gameMode !== 'BOSSRUSH'){ openEnchantMenu(b.owner); }
                    if(b.owner && b.owner.weapon.type === 'melee') checkMission('kill_melee'); if(en.type === 'SHOOTER') checkMission('kill_shooter'); if(en.elite) checkMission('kill_elite');
                    if(b.owner && b.owner.classType === 'SCOUT') { b.owner.hp = Math.min(b.owner.maxHp, b.owner.hp + (b.owner.maxHp * 0.05)); floatTexts.push(new FloatText(b.owner.x, b.owner.y-10, "+HP SCOUT", "#0f0", 8)); }
                    
                    if(gameMode === 'MADMAN' && Math.random() < 0.3) { let lootKeys = ['SWORD', 'REVOLVER', 'BOW', 'AXE']; let k = lootKeys[Math.floor(Math.random()*lootKeys.length)]; if(b.owner && b.owner.inventory.length < 5 && !b.owner.inventory.includes(k)) { b.owner.inventory.push(k); b.owner.weaponLevels[k]=1; floatTexts.push(new FloatText(b.owner.x, b.owner.y-20, "ARMA ENCONTRADA", "#0f0", 8)); updateInventoryUI(); } }
                    if(en.type !== 'BOSS' && en.elite && Math.random() < 0.05 && gameMode !== 'PVP' && gameMode !== 'SANDBOX') { if(b.owner && b.owner.id === 1 && !b.owner.inventory.includes('BISONTE')) { b.owner.inventory.push('BISONTE'); b.owner.weaponLevels['BISONTE'] = 1; floatTexts.push(new FloatText(b.owner.x, b.owner.y-30, "¡BISONTE LEYENDARIO!", "#f44", 15)); playSfx('powerup'); updateInventoryUI(); } }

                    let gDrop=(en.type==='BOSS' || en.type==='AI_BOSS'?150:15)*(en.elite?3:1); let goldMult = 1.0;
                    if(b.owner && b.owner.hasEnchant('greed')) goldMult += 0.5; if(b.owner && b.owner.id === 1 && purchasedSkills['fo_gold_1']) goldMult += purchasedSkills['fo_gold_1'] * 0.10;
                    gDrop *= goldMult; gold+=Math.floor(gDrop);
                    playSfx('coin');addShake(3);spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color,30,5,3);for(let k=0;k<3;k++)decals.push(new Decal(en.x+Math.random()*20-10,en.y+Math.random()*20-10,Math.random()>0.5?en.color:'#511',5+Math.random()*10));
                    
                    let killer = b.owner;
                    if(killer && killer.alive && (killer.hasRelic('vamp') || b.lifesteal) && killer.hp < killer.maxHp) { killer.hp = Math.min(killer.hp+2, killer.maxHp); floatTexts.push(new FloatText(killer.x, killer.y, "+2 RELIC", "#0f0", 8)); }
                    if(killer && killer.alive && killer.id === 1 && purchasedSkills['pr_vamp'] && killer.weapon.type === 'melee' && killer.hp < killer.maxHp) { let vampBase = killer.maxHp *purchasedSkills['pr_vamp'] * 0.01; killer.hp = Math.min(killer.maxHp, killer.hp + vampBase); floatTexts.push(new FloatText(killer.x, killer.y-5, "+VAMP", "#f33", 8)); }
                }
            }
        });
        if(hit) projectiles.splice(i,1);
    });

    enemyBullets.forEach((b,i)=>{
        let hit=false;
        [p1,p2].forEach(p=>{ if(p.alive&&p.isReflecting&&Math.hypot(b.x-(p.x+p.w/2),b.y-(p.y+p.h/2))<40){ b.vx*=-1;b.vy*=-1; b.reflected=true; playSfx('block');spawnParticles(b.x,b.y,'#4af',5,3); } });
        b.x+=b.vx;b.y+=b.vy; structures.forEach(st=>{if(b.x>st.x&&b.x<st.x+st.w&&b.y>st.y&&b.y<st.y+st.h){hit=true;spawnParticles(b.x,b.y,'#aaa',5,2);}});
        if(b.x<0||b.x>GAME_W||b.y<0||b.y>GAME_H) hit=true;

        if(b.reflected) { enemies.forEach((en,j)=>{ if(!hit && Math.hypot((en.x+en.w/2)-b.x, (en.y+en.h/2)-b.y) < en.w){ en.hp -= b.dmg * 2; en.flash=3; floatTexts.push(new FloatText(en.x,en.y,Math.floor(b.dmg*2), "#0af", 8)); hit=true; enemyBullets.splice(i,1); if(en.hp<=0 && !en.dead){ en.dead=true; gold+=15; } } }); } 
        else {
            [p1,p2].forEach(p=>{if(!hit&&p.alive&&b.x>p.x&&b.x<p.x+p.w&&b.y>p.y&&b.y<p.y+p.h){
                if(p.dashTimer>0 || p.invuln > 0)return;
                if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && purchasedSkills['tr_dodge'] && Math.random() < purchasedSkills['tr_dodge'] * 0.03) { floatTexts.push(new FloatText(p.x, p.y-10, "ESQUIVADO!", "#0ff", 8)); playSfx('dash'); spawnParticles(p.x, p.y, '#0ff', 5, 2); enemyBullets.splice(i,1); hit=true; return; }
                if(p.hasRelic('dodge') && p.dodgeCharges > 0) { p.dodgeCharges--; if(p.dodgeCharges<=0) p.dodgeTimer=600; floatTexts.push(new FloatText(p.x, p.y-10, "ESQUIVA RELIC!", "#0ff", 8)); playSfx('dash'); spawnParticles(p.x, p.y, '#0ff', 5, 2); enemyBullets.splice(i,1); hit=true; return; }
                applyDamage(p, b.dmg); enemyBullets.splice(i,1);hit=true;
            }});
        }
        if(hit) enemyBullets.splice(i,1);
    });

    enemies = enemies.filter(e => !e.dead);

    if(!p1.alive&&(!isCoop||!p2.alive)) { if(gameMode === 'PVP') { if(!p1.alive) gameOverPvP(2); else if(!p2.alive) gameOverPvP(1); } else gameOver(); }
    
    if(enemies.length===0 && state==='PLAYING' && spawnQueue.length === 0) {
        if(gameMode === 'BOSSRUSH') {
            state = 'GAMEOVER'; floatTexts.push(new FloatText(GAME_W/2, GAME_H/2, "¡JEFE DERROTADO!", "#0f0", 30));
            setTimeout(() => { document.getElementById('hud').style.display = 'none'; document.getElementById('inventory-hud').style.display = 'none'; document.getElementById('game-over-menu').style.display = 'flex'; document.querySelector('#game-over-menu h1').innerText = "¡VICTORIA!"; document.querySelector('#game-over-menu h1').style.color = "#0f0"; document.getElementById('death-wave').innerText = "MODO JEFES COMPLETADO"; }, 3000);
        } else if (gameMode !== 'PVP') {
             if(gameMode !== 'SANDBOX') {
                  let ptsBase = 1;
                  if(currentMission && currentMission.type === 'no_hit' && !currentMission.failed) { ptsBase = 2; floatTexts.push(new FloatText(GAME_W/2, 350, "+2 PUNTOS HABILIDAD (PERFECTO!)", "#fe0", 15)); } 
                  else floatTexts.push(new FloatText(GAME_W/2, 350, "+1 PUNTO HABILIDAD", "#aaa", 12));
                  if(p1.id === 1 && purchasedSkills['tr_xp_gain'] && wave % 5 === 0) { ptsBase++; floatTexts.push(new FloatText(GAME_W/2, 380, "+1 PUNTO BONO SABIDURÍA", "#0af", 12)); }
                  skillPoints += ptsBase; updateSkillPointsHUD();
             }
             openShop();
        }
    }

    let s=getWeaponStats(p1);
    let hpEl = document.getElementById('hp-bar'); hpEl.className = 'hp-fill';
    if(p1.rageMode > 0) hpEl.classList.add('flame-warrior'); else if(p1.speedBoost > 0) hpEl.classList.add('flame-scout'); else if(p1.tankAbilityActive > 0) hpEl.classList.add('flame-tank'); else if(p1.burstActive > 0) hpEl.classList.add('flame-marksman');
    hpEl.style.width=Math.max(0,p1.hp/p1.maxHp*100)+'%'; document.getElementById('arm-bar').style.width=Math.max(0,(p1.armor/p1.maxArmor)*100)+'%'; document.getElementById('gold-txt').innerText=gold; document.getElementById('wave-txt').innerText=wave; document.getElementById('weapon-txt').innerText=`ARMA: ${s.name} (LVL ${s.level})`; document.getElementById('ammo-hud').innerText=(s.maxAmmo)?(p1.reloadTimer>0?"[ RECARGANDO ]":`BALAS: ${p1.ammo}/${s.maxAmmo}`):"";
    let statusText = (p1.hasShield) ? "[ESCUDO LISTO - 'R']" : "";
    if(p1.abilityActiveTimer > 0) statusText += ` | HAB ACTIVA: ${Math.ceil(p1.abilityActiveTimer/60)}s`; else if(p1.abilityTimer > 0) statusText += ` | CD HAB: ${Math.ceil(p1.abilityTimer/60)}s`; else statusText += ` | HAB LISTA ('F')`;
    if(p1.bisonAbilityCD > 0) statusText += ` | BISON CD: ${Math.ceil(p1.bisonAbilityCD/60)}s`; else if(p1.weapon.name === 'BISONTE') statusText += ` | BISON LISTO ('F')`;
    if(p1.id === 1 && purchasedSkills['tr_teleport']) { if(p1.shieldJumpCd > 0) statusText = `[TELE CD: ${Math.ceil(p1.shieldJumpCd/60)}s] | ` + statusText; else statusText = `[TELE LISTO - 'R'] | ` + statusText; }
    document.getElementById('shield-status').innerText = statusText;
    if(!p1.autoAim) document.getElementById('weapon-txt').innerText += " [MANUAL]";
    if(isCoop || gameMode === 'PVP') document.getElementById('p2-hp-bar').style.width = Math.max(0,p2.hp/p2.maxHp*100)+'%';
    handleMobileAutoAttack(p1); // AutoFire Mobile
}

function getNearestEnemy(p){let n=null,md=Infinity;enemies.forEach(en=>{let d=Math.hypot(en.x-p.x,en.y-p.y);if(d<md){md=d;n=en;}});return n;}

function processBossAbilities(b,t){
    if(!t)return;b.abilityTimer--;
    if(b.abilityTimer<=0){
        b.abilityTimer=b.abilityMax; playSfx('boss'); let attackType = Math.random() < 0.5 ? 'PRIMARY' : 'SECONDARY';
        if(b.bossSubType==='SKELETON'){
            if(attackType === 'PRIMARY') { showBossAlert("INVOCACION!"); for(let i=0;i<2;i++){ let ex=b.x+Math.random()*100-50,ey=b.y+Math.random()*100-50; let s = getEnemyStats('GRUNT'); enemies.push({ x:ex,y:ey,w:20,h:20,hp:50*enemyPower,maxHp:50*enemyPower,speed:1,color:'#ccc', type:'GRUNT',flash:0,walkCycle:0, animOffset:{x:0,y:0}, atkState:0, atkRange:s.atkRange, atkWindup:s.atkWindup, atkDuration:s.atkDuration, reload:100 }); } } 
            else { showBossAlert("¡LLUVIA DE HUESOS!"); for(let i=0; i<8; i++){ let a = i*(Math.PI/4); enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*4.5,vy:Math.sin(a)*4.5,size:8,dmg:20*enemyPower}); } }
        } 
        else if(b.bossSubType==='GOLEM'){
            if(attackType === 'PRIMARY') { showBossAlert("¡SALTO SISMICO!"); let tx=t.x,ty=t.y;warnings.push({x:tx,y:ty,r:60,life:60}); setTimeout(()=>{b.x=tx;b.y=ty;spawnParticles(b.x+30,b.y+30,'#642',50,8,4);playSfx('explo');addShake(10);for(let i=0;i<12;i++){let a=i*(3.14/6);enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*5,vy:Math.sin(a)*4.5,size:8,dmg:25*enemyPower});}},1000); } 
            else { showBossAlert("¡ROCA GIGANTE!"); let ang = Math.atan2(t.y-b.y, t.x-b.x); enemyBullets.push({x:b.x+30, y:b.y+30, vx:Math.cos(ang)*7, vy:Math.sin(ang)*7, size:25, dmg:40*enemyPower}); }
        } 
        else if(b.bossSubType==='DEMON'){
            if(attackType === 'PRIMARY') { showBossAlert("RAYO MAGMA!"); let a=Math.atan2((t.y+10)-(b.y+30),(t.x+10)-(b.x+30));for(let i=0;i<5;i++)setTimeout(()=>{enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*7.5,vy:Math.sin(a)*7.5,size:10,dmg:30*enemyPower});spawnParticles(b.x+30+Math.cos(a)*10,b.y+30+Math.sin(a)*10,'#f00',10,3);},i*100); } 
            else { showBossAlert("¡ZONA EXPLOSIVA!"); for(let i=0; i<3; i++) { let rx = t.x + (Math.random()*200-100); let ry = t.y + (Math.random()*200-100); warnings.push({x:rx,y:ry,r:40,life:60}); setTimeout(()=>{spawnParticles(rx+30,ry+30,'#f50',20,5); playSfx('explo'); if(Math.hypot(t.x-rx, t.y-ry)<50){applyDamage(t, 30*enemyPower);}}, 1000); } }
        }
    }
}

function showBossAlert(t){
    if (isMobile) return; 
    let e=document.getElementById('boss-alert');
    e.innerText=t;e.style.display='block';setTimeout(()=>e.style.display='none',2000);
}

function switchWeapon(p,n){ const m=[null,'SWORD','AXE','SPEAR','SHIELD','BOW','REVOLVER','STAFF','CROSSBOW', 'MJOLNIR', 'BISONTE', 'GOLDGUN', 'SHOTGUN', 'FIST']; let k=m[n]; if(n <= p.inventory.length) { p.weapon = WEAPONS[p.inventory[n-1]]; } else if((gameMode === 'SANDBOX' || gameMode === 'BOSSRUSH') && k && p.inventory.includes(k)) { p.weapon=WEAPONS[k]; } updateInventoryUI(); }
function mobileSwapWeapon() { if(!p1 || p1.inventory.length === 0) return; currentInvIdx = (currentInvIdx + 1) % p1.inventory.length; switchWeapon(p1, currentInvIdx + 1); }

function openEnchantMenu(player) { if(!player) return; state = 'ENCHANT'; document.getElementById('enchant-menu').style.display='flex'; document.getElementById('ench-weapon-name').innerText = player.weapon.name; const container = document.getElementById('enchant-container'); container.innerHTML = ''; playSfx('enchant'); let options = []; let pool = [...ENCHANTS]; for(let i=0; i<3; i++) { let idx = Math.floor(Math.random()*pool.length); options.push(pool[idx]); pool.splice(idx, 1); } options.forEach(ench => { let card = document.createElement('div'); card.className = 'enchant-card'; card.innerHTML = `<div class="ench-title">${ench.name}</div><div class="ench-desc">${ench.desc}</div><div class="ench-type">${ench.type}</div>`; card.onclick = () => { applyEnchant(player, ench.id); }; container.appendChild(card); }); }
function applyEnchant(player, enchantId) { let wName = player.weapon.name; if(!player.weaponEnchants[wName]) player.weaponEnchants[wName] = []; player.weaponEnchants[wName].push(enchantId); document.getElementById('enchant-menu').style.display='none'; floatTexts.push(new FloatText(player.x, player.y-40, "ARMA ENCANTADA!", "#f0f")); playSfx('reload'); if(enemies.length === 0) openShop(); else state = 'PLAYING'; updateInventoryUI(); }

function handleMobileAutoAttack(p) {
    if (isMobile && p.autoAim && state === 'PLAYING') {
        let tg = getNearestEnemy(p);
        if (tg) {
            let dist = Math.hypot(tg.x - p.x, tg.y - p.y);
            if (dist < getWeaponStats(p).range + 20) {
                if (p.atkTimer <= 0) keys[KEYBINDS.p1_atk] = true; 
            } else { keys[KEYBINDS.p1_atk] = false; }
        }
    }
}

function performAttack(p){
    if(p.atkTimer>0)return; 
    let s=getWeaponStats(p);
    if(p.burstActive > 0 && s.maxAmmo) p.ammo = 99;
    if(s.maxAmmo){if(p.reloadTimer>0)return;if(p.ammo<=0){p.reloadTimer=s.reloadTime;playSfx('reload');return;}p.ammo--;}
    let critProb = 0.1; if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && gameMode !== 'BOSSRUSH' && purchasedSkills['pr_crit_1']) critProb += purchasedSkills['pr_crit_1'] * 0.05;
    let isCrit = Math.random() < critProb; let finalDmg = s.dmg * (isCrit ? 2 : 1);
    if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && purchasedSkills['fo_hoarder']) finalDmg *= (1 + Math.min(0.20, gold / 100 * 0.01));
    if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && purchasedSkills['pr_master'] && currentMission && !currentMission.failed && currentMission.type === 'no_hit') finalDmg *= 1.15;
    finalDmg = Math.round(finalDmg); p.atkTimer = s.cd; p.animTimer = s.cd; p.animMax = s.cd;
    playSfx(s.name==='ESCOPETA'?'shotgun' : (s.type==='melee'?'swing':(s.explosive?'heavy_shoot':'shoot')));
    p.vx-=Math.cos(p.angle)*s.recoil;p.vy-=Math.sin(p.angle)*s.recoil; if(s.shake)addShake(s.shake);

    if(s.type==='melee'){
        let hx=p.x+p.w/2+Math.cos(p.angle)*30, hy=p.y+p.h/2+Math.sin(p.angle)*30;
        let potentialTargets = gameMode === 'PVP' ? ((p.id === 1) ? [p2] : [p1]) : enemies;
        potentialTargets.forEach((en,i)=>{
            if(!en.alive && gameMode === 'PVP') return;
            let execDmg = finalDmg; if(p.id === 1 && purchasedSkills['pr_exec'] && (en.hp / en.maxHp) < 0.30) { execDmg = Math.round(execDmg * 1.20); }
            if(Math.hypot(hx-en.x-en.w/2,hy-en.y-en.h/2)<s.range){
                en.hp-=execDmg;en.flash=3;playSfx('hit');addShake(2); let txtCol = isCrit ? '#f80' : '#ff0'; let txtSz = isCrit ? 16 : 10;
                floatTexts.push(new FloatText(en.x+en.w/2,en.y,Math.floor(execDmg),txtCol,txtSz)); spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color || '#fff',10,4);
                if(en.x !== undefined && en.y !== undefined) { en.x+=Math.cos(p.angle)*10; en.y+=Math.sin(p.angle)*10; }
                if(s.lightning && gameMode !== 'PVP') { enemies.forEach(subEn => { if(subEn!==en && Math.hypot(subEn.x-en.x, subEn.y-en.y) < 150) { subEn.hp -= execDmg/2; subEn.flash=3; floatTexts.push(new FloatText(subEn.x+subEn.w/2,subEn.y,Math.floor(execDmg/2),'#0af', 8)); ctx.strokeStyle='#0ff'; ctx.beginPath(); ctx.moveTo(en.x+en.w/2,en.y+en.h/2); ctx.lineTo(subEn.x+subEn.w/2,subEn.y+subEn.h/2); ctx.stroke(); } }); }
                if(p.hasRelic('vamp') && p.hp < p.maxHp && Math.random() < 0.2) { p.hp = Math.min(p.hp+2, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "+2 RELIC", "#0f0", 8)); }
                if(s.lifesteal && p.hp < p.maxHp) { p.hp = Math.min(p.hp+5, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "+5 LIFESTEAL", "#a0a", 8)); }
                if(p.hasEnchant('vampire') && Math.random() < 100) { p.hp = Math.min(p.hp+5, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "VAMPIRO ENCH.", "#f00", 8)); }
                if(gameMode === 'PVP' && en.hp <= 0) { en.alive = false; setTimeout(() => gameOverPvP(p.id), 500); return; }
                if(en.hp<=0 && !en.dead && gameMode !== 'PVP'){
                    en.dead=true; if((en.type === 'BOSS' || en.type === 'AI_BOSS') && gameMode !== 'BOSSRUSH') openEnchantMenu(p);
                    checkMission('kill_melee'); if(en.type === 'SHOOTER') checkMission('kill_shooter'); if(en.elite) checkMission('kill_elite');
                    if(gameMode === 'MADMAN' && Math.random() < 0.3) { let lootKeys = ['SWORD', 'REVOLVER', 'BOW', 'AXE']; let k = lootKeys[Math.floor(Math.random()*lootKeys.length)]; if(p.inventory.length < 5 && !p.inventory.includes(k)) { p.inventory.push(k); p.weaponLevels[k]=1; floatTexts.push(new FloatText(p.x, p.y-20, "ARMA ENCONTRADA", "#0f0", 8)); updateInventoryUI(); } }
                    if(p.classType === 'SCOUT') { p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.05)); floatTexts.push(new FloatText(p.x, p.y-10, "+HP SCOUT", "#0f0", 8)); }
                    if(p.id === 1 && gameMode !== 'PVP' && gameMode !== 'SANDBOX' && purchasedSkills['pr_vamp'] && p.weapon.type === 'melee' && p.hp < p.maxHp) { let vampBase = p.maxHp *purchasedSkills['pr_vamp'] * 0.01; p.hp = Math.min(p.maxHp, p.hp + vampBase); floatTexts.push(new FloatText(p.x, p.y-5, "+VAMP KILL", "#f33", 8)); }
                    gold+=15;playSfx('coin');spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color,30,5,3);for(let k=0;k<3;k++)decals.push(new Decal(en.x+Math.random()*20-10,en.y+Math.random()*20-10,Math.random()>0.5?en.color:'#511',5+Math.random()*10));
                }
        }});
    }else{
        let count = s.count || 1; if(p.hasEnchant('multishot') && Math.random() < 0.2) count++;
        for(let i=0; i<count; i++){ let ang = p.angle; if(count > 1) ang += (Math.random()-0.5) * (s.spread || 0.2); projectiles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:Math.cos(ang)*10,vy:Math.sin(ang)*10,dmg:finalDmg,explosive:s.explosive,pierce:s.pierce, lightning:s.lightning, lifesteal:s.lifesteal, isCrit:isCrit, owner: p}); }
        spawnParticles(p.x+p.w/2+Math.cos(p.angle)*20,p.y+p.h/2+Math.sin(p.angle)*20,s.color,10,3,2);
    }
}

function draw(){
    if(state === 'MENU') { ctx.fillStyle='#000'; ctx.fillRect(0,0,GAME_W,GAME_H); return; }
    if(document.getElementById('skills-menu').style.display === 'flex') { return; }

    ctx.save();if(screenShake>0){ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);}
    ctx.fillStyle=currentBiome.bg;ctx.fillRect(0,0,GAME_W,GAME_H);ctx.fillStyle=currentBiome.floor;for(let i=0;i<GAME_W;i+=40)for(let j=0;j<GAME_H;j+=40)if((i+j)%80===0)ctx.fillRect(i,j,40,40);
    decals.forEach(d=>{ if(d.type === 'COIN') { ctx.fillStyle = '#fe0'; ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#d40'; ctx.lineWidth=2; ctx.stroke(); } else { d.draw(ctx); } });
    traps.forEach(tr=>tr.draw(ctx));
    warnings.forEach(w=>{ctx.fillStyle=`rgba(255,0,0,${0.2+(w.life%10)/50})`;ctx.beginPath();ctx.arc(w.x,w.y,w.r,0,6.28);ctx.fill();ctx.strokeStyle='#f00';ctx.lineWidth=2;ctx.stroke();});
    structures.forEach(st=>{ctx.fillStyle=currentBiome.wall;ctx.fillRect(st.x,st.y,st.w,st.h);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(st.x,st.y,st.w,st.h);});
    particles.forEach(p=>p.draw(ctx));
    
    enemies.forEach(en=>{
        ctx.save(); let visualX = en.x + en.w/2; let visualY = en.y + en.h/2;
        if(en.animOffset) { visualX += en.animOffset.x || 0; visualY += en.animOffset.y || 0; }
        ctx.translate(visualX, visualY);
        let bounce = Math.sin(en.walkCycle)*2; let lean = Math.cos(en.walkCycle)*0.1;
        if(en.type === 'AI_BOSS') lean = (en.vx || 0) * 0.05; 
        ctx.translate(0, bounce); ctx.rotate(lean);

        if(en.type === 'BOSS') {
            ctx.fillStyle = en.flash>0?'#fff':en.color;
            if(en.bossSubType === 'SKELETON') { ctx.fillRect(-25,-35,50,50); ctx.fillStyle = '#000'; ctx.fillRect(-15,-25,10,10); ctx.fillRect(5,-25,10,10); ctx.fillRect(-5,-5,10,15); } 
            else if (en.bossSubType === 'GOLEM') { ctx.fillRect(-30,-30,60,60); ctx.fillStyle = '#422'; ctx.fillRect(-40,-10,10,40); ctx.fillRect(30,-10,10,40); ctx.fillStyle = '#0f0'; ctx.fillRect(-5,-5,10,10); } 
            else if (en.bossSubType === 'DEMON') { ctx.fillRect(-25,-30,50,60); ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.moveTo(-20,-30); ctx.lineTo(-30,-50); ctx.lineTo(-10,-30); ctx.fill(); ctx.beginPath(); ctx.moveTo(20,-30); ctx.lineTo(30,-50); ctx.lineTo(10,-30); ctx.fill(); }
            ctx.strokeStyle='#ff0';ctx.lineWidth=3;ctx.strokeRect(-en.w/2,-en.h/2,en.w,en.h);
        } else if (en.type === 'AI_BOSS') {
            ctx.fillStyle = en.flash > 0 ? '#fff' : en.color; let sizeMod = (en.ai && en.ai.enraged) ? 1.5 : 1; ctx.scale(sizeMod, sizeMod);
            ctx.fillRect(-10, -10, 20, 20); ctx.fillStyle = '#f00'; ctx.fillRect(0, -6, 8, 4); 
            ctx.save(); let aimAngle = en.ai && en.ai.chargeAng ? en.ai.chargeAng : Math.atan2((p1.y+p1.h/2) - (en.y+en.h/2), (p1.x+p1.w/2) - (en.x+en.w/2)); ctx.rotate(aimAngle - lean); ctx.fillStyle = '#f44'; ctx.fillRect(10, -2, 18, 4); ctx.restore();
            if(en.ai && en.ai.enraged) { ctx.shadowBlur = 20; ctx.shadowColor = '#f00'; ctx.strokeStyle = '#f00'; ctx.strokeRect(-11, -11, 22, 22); ctx.shadowBlur = 0; }
        } else {
            ctx.fillStyle=en.flash>0?'#fff':en.color; if(en.atkState === 1 && gameTick%4 < 2) ctx.fillStyle = '#fff';
            ctx.fillRect(-en.w/2,-en.h/2,en.w,en.h);
            if(en.type === 'GRUNT') { ctx.fillStyle = '#000'; ctx.fillRect(-5, -5, 4, 4); ctx.fillRect(1, -5, 4, 4); } 
            else if (en.type === 'TANK') { ctx.fillStyle = '#222'; ctx.fillRect(-en.w/2, -2, en.w, 4); ctx.fillStyle = '#000'; ctx.fillRect(-10, -8, 20, 4); } 
            else if (en.type === 'SHOOTER') { ctx.fillStyle = '#f0f'; ctx.fillRect(-2, -2, 4, 4); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(-en.w/2+2, -en.h/2+2, en.w-4, en.h-4); }
            if(en.elite){ctx.strokeStyle='#fe0';ctx.lineWidth=2;ctx.strokeRect(-en.w/2,-en.h/2,en.w,en.h);}
        }
        ctx.fillStyle='#f00';ctx.fillRect(-en.w/2,-en.h/2-6,en.w,4);ctx.fillStyle='#0f0';ctx.fillRect(-en.w/2,-en.h/2-6,en.w*(en.hp/en.maxHp),4);
        ctx.restore();
    });

    projectiles.forEach(b=>{ctx.fillStyle=b.explosive?'#f80':(b.pierce?'#0ff':(b.isCrit?'#f80':'#ff0'));ctx.fillRect(b.x-2,b.y-2,b.explosive?6:4,b.explosive?6:4);});
    enemyBullets.forEach(b=>{ctx.fillStyle=b.reflected?'#0ff':'#f0f';ctx.fillRect(b.x-b.size/2,b.y-b.size/2,b.size,b.size);});
    
    [p1,p2].forEach(p=>{if(!p.alive)return;ctx.save();ctx.translate(Math.floor(p.x+p.w/2),Math.floor(p.y+p.h/2));
        let s=getWeaponStats(p); if(p.atkTimer>0&&!s.maxAmmo&&!p.comboTimer){ctx.fillStyle='#000';ctx.fillRect(-12,12,24,4);ctx.fillStyle='#ff0';ctx.fillRect(-11,13,22*(1-p.atkTimer/s.cd),2);}
        if(p.dashCd>0){ctx.fillStyle='#000';ctx.fillRect(-12,17,24,2);ctx.fillStyle='#0ff';ctx.fillRect(-12,17,24*(1-p.dashCd/150),2);}
        if(p.rageMode > 0) { ctx.shadowBlur = 30; ctx.shadowColor = '#f00'; ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; } else if(p.speedBoost > 0) { ctx.shadowBlur = 30; ctx.shadowColor = '#0ff'; ctx.fillStyle = 'rgba(0,255,255,0.5)'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; } else if(p.tankAbilityActive > 0) { ctx.shadowBlur = 30; ctx.shadowColor = '#0f0'; ctx.fillStyle = 'rgba(0,255,0,0.5)'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; } else if(p.burstActive > 0) { ctx.shadowBlur = 30; ctx.shadowColor = '#f0f'; ctx.fillStyle = 'rgba(255,0,255,0.5)'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; }
        let walkBob = Math.sin(p.walkCycle) * 2; ctx.translate(0, walkBob); ctx.rotate(p.angle);
        ctx.fillStyle=p.dashTimer>0?'#fff':p.skin.body;ctx.fillRect(-10,-10,20,20);ctx.fillStyle='#000';ctx.strokeRect(-10,-10,20,20);ctx.fillStyle=p.skin.detail;ctx.fillRect(0,-6,8,4);
        ctx.fillStyle = p.skin.body; ctx.strokeStyle = '#000'; ctx.lineWidth = 1; let recoilOffset = (p.atkTimer > 0) ? (p.atkTimer/s.cd)*4 : 0;
        if(p.isReflecting) { ctx.save(); ctx.translate(10, -8); ctx.fillStyle = '#4af'; ctx.fillRect(-2,-8, 4, 16); ctx.beginPath(); ctx.arc(0,0, 4, 0, Math.PI*2); ctx.fillStyle=p.skin.body; ctx.fill(); ctx.stroke(); ctx.restore(); ctx.strokeStyle='#4af';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,-1,1);ctx.stroke(); }
        if(p.weapon.name === 'PUÑOS') { ctx.save(); let punch = (p.weapon.name === 'PUÑOS' && p.animTimer > 0) ? Math.sin((1-p.animTimer/p.animMax) * Math.PI) * 12 : 0; let rhx = 10 + punch, rhy = 6; ctx.translate(rhx - recoilOffset, rhy + Math.sin(p.walkCycle)*1.5); ctx.beginPath(); ctx.arc(0,0, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore(); }
        let ia=p.animTimer>0,ap=1-(p.animTimer/p.animMax),n=s.name; ctx.save();
        if(s.type==='ranged'&&ia){let k=Math.sin(ap*Math.PI)*6;ctx.translate(-k,0);ctx.rotate(-k/10);}
        let rev = (s.type==='melee' && p.lastAttackReverse);
        if(n==="ESPADA")dSW(ctx,dP_Sw,ap,rev);else if(n==="HACHA")dSW(ctx,dP_Ax,ap,rev);else if(n==="LANZA")dST(ctx,dP_Sp,ap);else if(n==="ESCUDO")dP_Sh(ctx,0,0,0,p.skin.body);else if(n==="ARCO")dP_Bo(ctx,0,0,0,p.animTimer);else if(n==="REVOLVER")dP_Rv(ctx,0,0,0,p.animTimer);else if(n==="VARA FUEGO")dP_St(ctx,0,0,0,ia);else if(n==="BALLESTA")dP_Cr(ctx,0,0,0,ia);else if(n==="ESCOPETA")dP_Sg(ctx,0,0,0,ia);else if(n==="MJOLNIR")dSW(ctx,dP_Mj,ap,rev); else if(n==="CAÑON ORO")dP_Gc(ctx,0,0,0,ia); else if(n==="BISONTE")dSW(ctx,dP_Bi,ap,rev); 
        ctx.restore();
        if(s.maxAmmo&&p.reloadTimer>0){ctx.rotate(-p.angle);ctx.fillStyle="#ff0";ctx.font="8px 'Press Start 2P'";ctx.fillText("RELOAD",-20,-20);}
        if(p.hasRelic('dodge')){ctx.fillStyle = p.dodgeCharges>0 ? '#0af' : '#666'; ctx.font="8px 'Press Start 2P'";ctx.fillText(p.dodgeCharges>0 ? `(${p.dodgeCharges})` : "(Recarga)", -15, -25);}
        ctx.restore();});
    floatTexts.forEach(f=>f.draw(ctx)); ctx.restore();
}

function dSW(c,d,p,r=false){if(p>=1||p<=0){d(c,0,0,0,false);return;}let a=Math.sin(Math.pow(p,0.7)*Math.PI)*(r?2.5:-2.5),l=Math.sin(p*Math.PI)*8;c.translate(l,0);c.rotate(a);d(c,0,0,0,true);}
function dST(c,d,p){if(p>=1||p<=0){d(c,0,0,0,false);return;}let s=Math.sin(Math.pow(p,0.5)*Math.PI)*25;c.translate(s,0);d(c,0,0,0,true);}
function dP_Sw(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-0.78);let k=2,p=[[0,0,1,0,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[1,1,4,1,1],[1,4,4,4,1],[0,1,5,1,0],[0,1,5,1,0],[0,1,4,1,0]];dM(c,p,k,-2,-10);c.restore();}
function dP_Ax(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-1.04);let k=2,p=[[0,0,1,1,1,0],[0,1,2,2,3,1],[1,2,2,2,3,1],[1,2,2,2,3,1],[1,2,2,2,3,1],[0,1,5,3,1,0],[0,0,5,1,0,0],[0,0,5,0,0,0],[0,0,5,0,0,0],[0,0,5,0,0,0],[0,0,1,0,0,0]];dM(c,p,k,-3,-8);c.restore();}
function dP_Sp(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,1,0],[1,2,1],[1,2,1],[1,2,1],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0]];dM(c,p,k,-1,-14);c.restore();}
function dP_Sh(c,x,y,a,col){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,1,1,1,0],[1,2,2,2,1],[1,2,2,2,1],[1,2,2,2,1],[1,2,2,2,1],[0,1,2,1,0],[0,0,1,0,0]];dM(c,p,k,-2,-3,col);c.restore();}
function dP_Bo(c,x,y,a,t){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,0,1,0,0],[0,1,5,1,0],[1,5,0,5,1],[1,5,0,5,1],[1,5,0,5,1],[0,1,5,1,0],[0,0,1,0,0]];dM(c,p,k,-2,-3,'#631');c.strokeStyle='#eee';c.lineWidth=1;c.beginPath();let pu=t>0?Math.min(6,t/5):0;c.moveTo(-2*k,-3*k);c.lineTo(0,0+pu);c.lineTo(-2*k,4*k);c.stroke();c.restore();}
function dP_Rv(c,x,y,a,t){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,r=t>20?-3:0,p=[[0,1,1,0],[0,2,2,0],[0,1,1,0],[1,2,2,1],[1,1,1,1],[0,3,3,0],[0,3,3,0]];dM(c,p,k,-2,-4+r);c.restore();}
function dP_St(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,4,0],[4,2,4],[0,4,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0]];dM(c,p,k,-1,-6,'#f00');c.restore();}
function dP_Cr(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,1,5,1,0],[1,0,5,0,1],[1,0,5,0,1],[0,1,5,1,0],[0,0,5,0,0]];dM(c,p,k,-2,-3);c.restore();}
function dP_Sg(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,1,1,0],[1,2,2,1],[1,2,2,1],[1,2,2,1],[0,5,5,0],[0,5,5,0],[0,5,5,0]];dM(c,p,k,-2,-3,'#666');c.restore();}
function dP_Mj(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-0.7);let k=2,p=[[0,2,2,2,0],[2,3,3,3,2],[2,3,4,3,2],[2,3,3,3,2],[0,2,2,2,0],[0,0,5,0,0],[0,0,5,0,0],[0,0,5,0,0]];dM(c,p,k,-2,-6,'#88a');c.restore();}
function dP_Gc(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,4,4,0],[4,4,4,4],[4,4,4,4],[0,1,1,0]];dM(c,p,k,-2,-3,'#fd0');c.restore();}
function dP_Bi(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-0.7);let k=2; let p=[ [0,1,1,0,0],[1,4,4,1,0],[1,2,4,4,1],[0,1,2,2,1],[0,0,1,2,1],[0,0,1,3,1],[0,0,1,5,1],[0,1,5,5,1],[1,5,3,1,0],[1,3,3,1,0],[0,1,1,0,0] ]; dM(c,p,k,-2,-5); c.restore();}
function dM(c,p,s,ox,oy,sc){for(let r=0;r<p.length;r++)for(let k=0;k<p[r].length;k++){let v=p[r][k];if(v!==0){if(v===1)c.fillStyle='#222';if(v===2)c.fillStyle=sc||'#eee';if(v===3)c.fillStyle='#631';if(v===4)c.fillStyle='#f33';if(v===5)c.fillStyle='#fe0';c.fillRect((k+ox)*s,(r+oy)*s,s,s);}}}

function refreshShop() { if(gold>=50){gold-=50; openShop(); updateShopUI(); playSfx('coin');} }
function openShop() { 
    state='SHOP'; document.getElementById('shop-menu').style.display='flex'; document.getElementById('shop-gold').innerText=gold;
    const cw = document.getElementById('shop-weapons-rng'); cw.innerHTML=''; const cr = document.getElementById('shop-relics-rng'); cr.innerHTML=''; const cc = document.getElementById('shop-consumables'); cc.innerHTML=''; const cs = document.getElementById('shop-sell'); cs.innerHTML='';
    let wKeys = Object.keys(WEAPONS).filter(k => k!=='FIST' && !WEAPONS[k].unique); let randWeapons = []; let shopMult = 1.0; if(purchasedSkills['fo_shop_disc']) shopMult *= (1 - purchasedSkills['fo_shop_disc'] * 0.05);
    wKeys.forEach(k => { if(k==='STAFF') WEAPONS[k].cost = 450; if(k==='SHOTGUN') WEAPONS[k].cost = 200; });
    for(let i=0; i<5; i++) { let key = wKeys[Math.floor(Math.random()*wKeys.length)]; randWeapons.push(WEAPONS[key]); }
    randWeapons[0] = WEAPONS.MJOLNIR;
    randWeapons.forEach(w => {
        let d=document.createElement('div'); d.className='shop-item'; let owned=p1.inventory.includes(getWeaponKeyName(w.id)); let lvl=p1.weaponLevels[getWeaponKeyName(w.id)]||1; let price = owned ? 50*lvl : Math.round(w.cost * shopMult); if(w.legendary) d.classList.add('legendary-item');
        d.innerHTML = owned ? `<span>MEJORAR ${w.name}</span><span style="font-size:8px">LVL ${lvl}->${lvl+1}</span><span style="color:#fe0">$${price}</span>` : `<span>${w.name}</span><span style="color:#fe0">$${price}</span>`;
        d.onclick = () => { if(gold>=price){ if(w.name === "ESCUDO") { gold-=price; playSfx('coin'); p1.hasShield = true; d.classList.add('purchased'); updateShopUI(); return; } if(!owned && p1.inventory.length >= 5 && gameMode!=='SANDBOX') { alert("INVENTARIO LLENO (5/5)"); return; } gold-=price;playSfx('coin'); [p1, (isCoop?p2:null)].forEach(p=>{ if(p) { if(owned){p.weaponLevels[getWeaponKeyName(w.id)]++;} else{p.inventory.push(getWeaponKeyName(w.id));p.weaponLevels[getWeaponKeyName(w.id)]=1;} } }); d.classList.add('purchased'); updateShopUI(); updateInventoryUI(); openShop(); } };
        cw.appendChild(d);
    });
    let availableRelics = RELICS.filter(r => !p1.hasRelic(r.id));
    if(availableRelics.length > 0) { let randRelics = []; for(let i=0; i<3; i++) { if(availableRelics.length===0) break; let idx = Math.floor(Math.random()*availableRelics.length); randRelics.push(availableRelics[idx]); availableRelics.splice(idx,1); } randRelics.forEach(r => { let d=document.createElement('div'); d.className='shop-item relic-card'; let price = Math.round(r.cost * shopMult); d.innerHTML = `<span>${r.name}</span><div class="relic-desc">${r.desc}</div><span style="color:#fe0">$${price}</span>`; d.onclick = () => { if(gold>=price){gold-=price;playSfx('coin'); [p1, (isCoop?p2:null)].forEach(p=>{ if(p) p.relics.push(r.id); }); d.classList.add('purchased'); updateShopUI(); updateRelicUI();} }; cr.appendChild(d); }); } else { cr.innerHTML = '<div style="font-size:10px; color:#888; text-align:center; padding:10px;">AGOTADAS</div>'; }
    let cons = [{k:'HP',l:'POCIÓN VIDA',c:30}, {k:'ARMOR',l:'ARMADURA',c:50}];
    cons.forEach(it=>{ let d=document.createElement('div'); d.className='shop-item'; let price = Math.round(it.c * shopMult); d.innerHTML = `<span>${it.l}</span><span style="color:#fe0">$${price}</span>`; d.onclick = () => { if(gold>=price){gold-=price;playSfx('coin'); [p1, (isCoop?p2:null)].forEach(p=>{ if(p && p.alive) { if(it.k==='ARMOR')p.armor=50; else p.hp=p.maxHp; } }); updateShopUI();} }; cc.appendChild(d); });
    p1.inventory.forEach(invKey => { let w = WEAPONS[invKey]; if(w.name === 'PUÑOS') return; let isEquipped = (w.name === p1.weapon.name) || (isCoop && p2.weapon.name === w.name); let sellPrice = Math.floor(w.cost / 2) || 50; let d=document.createElement('div'); d.className='shop-item sell-mode'; if(isEquipped) d.classList.add('cant-sell'); d.innerHTML = `<span>${w.name}</span><span style="color:#f44; font-size:8px;">${isEquipped ? "EQUIPADA" : "VENDER +$"+sellPrice}</span>`; d.onclick = () => { if(isEquipped) return; gold += sellPrice; playSfx('coin'); [p1, (isCoop?p2:null)].forEach(p=>{ if(p) { p.inventory = p.inventory.filter(k => k !== invKey); } }); openShop(); updateInventoryUI(); }; cs.appendChild(d); });
}
function getWeaponKeyName(id) { for(let k in WEAPONS) if(WEAPONS[k].id===id)return k; return 'SWORD'; }
function updateShopUI() { document.getElementById('shop-gold').innerText=gold; }
function updateRelicUI() { let el = document.getElementById('relics-list'); el.innerHTML=''; if(!p1) return; p1.relics.forEach(rid => { let r = RELICS.find(x=>x.id===rid); if(!r) return; let d = document.createElement('div'); d.style.width='8px'; d.style.height='8px'; d.style.background='#0af'; d.style.border='1px solid #fff'; d.title=r.name; d.style.marginBottom='2px'; el.appendChild(d); }); }
function updateInventoryUI() { if(!p1) return; const el = document.getElementById('inventory-hud'); el.innerHTML = ''; p1.inventory.forEach((key, idx) => { let w = WEAPONS[key]; let d = document.createElement('div'); d.className = 'inv-slot' + (p1.weapon.name === w.name ? ' active' : ''); if(w.unique || w.legendary) d.classList.add('legendary'); let enchInd = ''; if(p1.weaponEnchants[w.name] && p1.weaponEnchants[w.name].length > 0) { enchInd = '<div class="ench-indicator" style="display:block"></div>'; } d.innerHTML = `<span class="inv-key">${idx+1}</span>${w.name.substring(0,3)}${enchInd}`; d.title = w.name; d.onclick = () => { switchWeapon(p1, idx+1); if(isCoop) switchWeapon(p2, idx+1); }; el.appendChild(d); }); }
function nextWave() { wave++; state='PLAYING'; document.getElementById('shop-menu').style.display='none'; spawnLevel(); }
function loop() { update(); draw(); requestAnimationFrame(loop); }
window.onload = () => { organizeMainMenu(); if(localStorage.getItem('pd_save_data')) document.getElementById('btn-continue').style.display='inline-block'; updatePreview(1); updatePreview(2); updateClassUI(1); updateClassUI(2); };
window.onkeydown=e=>{ let k = e.key.toLowerCase(); if(document.getElementById('skills-menu').style.display === 'flex' && k !== 'control') return; if(bindingAction){ KEYBINDS[bindingAction]=k;bindingAction=null;saveKeys();renderControls();return; } if(e.key==='Escape')togglePause(); keys[k]=true; }
window.onkeyup=e=>{if(!bindingAction)keys[e.key.toLowerCase()]=false;}

function detectMobile() {
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
        
        const joyZone = document.getElementById('joystick-zone');
        const joyStick = document.getElementById('joystick-stick');
        let joyRect;
        
        joyZone.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation(); joyActive = true; joyRect = joyZone.getBoundingClientRect();
            updateJoy(e.touches[0]);
        }, {passive: false});
        
        joyZone.addEventListener('touchmove', (e) => { e.preventDefault(); e.stopPropagation(); if(joyActive) updateJoy(e.touches[0]); }, {passive: false});
        joyZone.addEventListener('touchend', (e) => {
            e.preventDefault(); e.stopPropagation(); joyActive = false; joyStick.style.transform = `translate(0px, 0px)`;
        }, {passive: false});
        
        function updateJoy(t) {
            let cx = joyRect.left + joyRect.width/2; let cy = joyRect.top + joyRect.height/2;
            let dx = t.clientX - cx; let dy = t.clientY - cy;
            joyDist = Math.hypot(dx, dy); joyAngle = Math.atan2(dy, dx);
            let maxDist = 35;
            if(joyDist > maxDist) { dx = Math.cos(joyAngle)*maxDist; dy = Math.sin(joyAngle)*maxDist; joyDist = maxDist; }
            joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        setupTouchBtn('m-atk', KEYBINDS.p1_atk);
        setupTouchBtn('m-dash', KEYBINDS.p1_dash);
        setupTouchBtn('m-shield', KEYBINDS.p1_shield);
        setupTouchBtn('m-spec', KEYBINDS.p1_special);
        setupTouchBtn('m-lock', KEYBINDS.p1_lock);
        
        let mSwap = document.getElementById('m-swap');
        mSwap.addEventListener('touchstart', (e)=>{ e.preventDefault(); e.stopPropagation(); mSwap.style.transform = "scale(0.9)"; mobileSwapWeapon(); });
        mSwap.addEventListener('touchend', (e)=>{ e.preventDefault(); e.stopPropagation(); mSwap.style.transform = "scale(1)"; });
    }
}

function setupTouchBtn(id, keyKey) {
    const btn = document.getElementById(id);
    if(!btn) return;
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); keys[keyKey] = true; btn.style.background = "rgba(255,255,255,0.7)"; }, {passive: false});
    btn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); keys[keyKey] = false; btn.style.background = ""; }, {passive: false});
}

detectMobile();