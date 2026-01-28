// --- MUSIC PLAYER ---
let bgm = new Audio();
function playBossMusic(waveNum) {
    bgm.pause();
    let track = "";
    
    // Nivel 5: boss1 | Nivel 10: boss2 | Nivel 15+: Aleatorio
    if (waveNum === 5) track = "boss1.aac";
    else if (waveNum === 10) track = "boss2.aac";
    else if (waveNum % 5 === 0) track = Math.random() < 0.5 ? "boss1.aac" : "boss2.aac";

    if (track !== "") {
        bgm.src = track;
        bgm.play().catch(e => console.log("Haz clic para activar música"));
        
        // Actualiza el HUD si el elemento existe
        const songTxt = document.getElementById('song-name');
        if(songTxt) { songTxt.innerText = "BOSS: " + track; songTxt.style.color = "#f44"; }
    }
}
bgm.loop = true;
bgm.volume = 0.5;
let optionsOrigin = 'MENU'; 

// --- NUEVA LÓGICA DE MÚSICA DINÁMICA ---
function playBossMusic(waveNum) {
    bgm.pause(); // Detener música normal
    
    let track = "";
    if (waveNum === 5) {
        track = "boss1.aac"; // Primer Jefe
    } else if (waveNum === 10) {
        track = "boss2.aac"; // Segundo Jefe
    } else if (waveNum === 15) {
        // 50% de probabilidad para el Jefe Final
        track = Math.random() < 0.5 ? "boss1.aac" : "boss2.aac";
    }

    if (track !== "") {
        bgm.src = track;
        bgm.play().catch(e => console.log("Esperando interacción para sonar música..."));
        document.getElementById('song-name').innerText = "BOSS BATTLE: " + track;
        document.getElementById('song-name').style.color = "#f00";
    }
}

// Modifica tu función spawnLevel para que active la música
function spawnLevel() {
    enemies=[]; projectiles=[]; enemyBullets=[]; structures=[]; warnings=[]; particles=[]; floatTexts=[]; decals=[]; traps=[];
    currentBiome=BIOMES[Math.floor((wave-1)/5)%BIOMES.length];
    document.getElementById('biome-txt').innerText=currentBiome.name;
    
    // SI ES NIVEL DE JEFE (Múltiplos de 5)
    if(wave % 5 === 0) {
        playBossMusic(wave); // <-- LLAMADA A LA MÚSICA
        let cd=600; 
        enemies.push({x:500,y:100,w:60,h:60,hp:(1000+wave*100),maxHp:(1000+wave*100),speed:0.8,color:currentBiome.bossColor,type:'BOSS',bossSubType:currentBiome.bossType,flash:0,range:400,abilityTimer:cd,abilityMax:cd,walkCycle:0});
    } else {
        // Si no es jefe, podrías poner música de mazmorra normal aquí
        let total = 5 + Math.floor(wave*1.5);
        for(let i=0; i<total; i++) {
            enemies.push({x:Math.random()*1000,y:Math.random()<0.5?-50:750,w:20,h:20,hp:100, maxHp:100, speed:0.9,color:'#383',type:'GRUNT', flash:0, walkCycle:0});
        }
    }
}
function toggleMusic(){ if(bgm.paused && bgm.src) bgm.play(); else bgm.pause(); }
function setMusicVol(v){ bgm.volume = v; }

// --- KEYBINDINGS & CONFIG ---
const DEFAULT_KEYS = {p1_up:'w',p1_down:'s',p1_left:'a',p1_right:'d',p1_atk:'e',p1_dash:' ',p1_shield:'r',p2_up:'arrowup',p2_down:'arrowdown',p2_left:'arrowleft',p2_right:'arrowright',p2_atk:'l', p2_dash:'k', p2_shield:'j'};
let KEYBINDS = JSON.parse(localStorage.getItem('pd_keybinds')) || {...DEFAULT_KEYS};
let bindingAction = null;
function saveKeys() { localStorage.setItem('pd_keybinds', JSON.stringify(KEYBINDS)); }
function restoreDefaultKeys() { KEYBINDS = {...DEFAULT_KEYS}; saveKeys(); renderControls(); }
function getKeyLabel(key) { if(key===' ')return'SPACE'; if(key.includes('arrow'))return key.replace('arrow','').toUpperCase(); return key.toUpperCase(); }
function startRebind(action) { bindingAction=action; renderControls(); }
function renderControls() {
    const render = (map, id) => {
        let h = `<h3>${id===1?'JUGADOR 1':'JUGADOR 2'}</h3>` + map.map(i => `<div class="opt-row"><span>${i.l}</span><button class="key-btn ${bindingAction===i.k?'binding':''}" onclick="startRebind('${i.k}')">${bindingAction===i.k?'...':getKeyLabel(KEYBINDS[i.k])}</button></div>`).join('');
        const el = document.getElementById(id===1?'p1-controls':'p2-controls');
        if(el) el.innerHTML = h;
    };
    render([{k:'p1_up',l:'ARRIBA'},{k:'p1_down',l:'ABAJO'},{k:'p1_left',l:'IZQUIERDA'},{k:'p1_right',l:'DERECHA'},{k:'p1_atk',l:'ATACAR'},{k:'p1_dash',l:'DASH'},{k:'p1_shield',l:'ESCUDO'}], 1);
    render([{k:'p2_up',l:'ARRIBA'},{k:'p2_down',l:'ABAJO'},{k:'p2_left',l:'IZQUIERDA'},{k:'p2_right',l:'DERECHA'},{k:'p2_atk',l:'ATACAR'},{k:'p2_dash',l:'DASH'},{k:'p2_shield',l:'ESCUDO'}], 2);
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
    
    g.gain.linearRampToValueAtTime(0,t+(type==='boss'?1.5:0.3));
    osc.connect(g);g.connect(audioCtx.destination);osc.start();osc.stop(t+(type==='boss'?1.5:0.3));
}

const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resolveCollisions(e, nx, ny) {
    e.x = nx; e.y = ny;
    // Evita que el jugador o enemigos se salgan de los bordes (1000x700)
    e.x = Math.max(0, Math.min(1000 - e.w, e.x));
    e.y = Math.max(0, Math.min(700 - e.h, e.y));
}

// GAME MODES
let gameMode = 'NORMAL'; 
let madmanTimer = 0;
let sandboxBotAggro = false;

function toggleGameMode(){
    if(gameMode==='NORMAL'){ 
        gameMode='MADMAN'; 
        document.getElementById('btn-mode').innerText="MODO: MAZMORRA LOCO"; 
        document.getElementById('btn-mode').style.borderColor='#f0f'; 
    } else if(gameMode==='MADMAN'){
        gameMode='SANDBOX';
        document.getElementById('btn-mode').innerText="MODO: SANDBOX";
        document.getElementById('btn-mode').style.borderColor='#0ff';
    } else { 
        gameMode='NORMAL'; 
        document.getElementById('btn-mode').innerText="MODO: NORMAL"; 
        document.getElementById('btn-mode').style.borderColor='#a0a'; 
    }
}

function toggleSandboxBot(){
    sandboxBotAggro = !sandboxBotAggro;
    let b = document.getElementById('btn-bot-aggro');
    b.innerText = sandboxBotAggro ? "BOT: AGRESIVO" : "BOT: PASIVO";
    if(sandboxBotAggro) b.classList.add('sb-active'); else b.classList.remove('sb-active');
}

function openOptions(fromPause = false) { 
    if(fromPause) {
        optionsOrigin = 'PAUSE';
        document.getElementById('pause-menu').style.display='none';
    } else {
        optionsOrigin = 'MENU';
        document.getElementById('main-menu').style.display='none';
    }
    document.getElementById('options-menu').style.display='flex'; 
    renderControls(); 
}

function closeOptions() { 
    document.getElementById('options-menu').style.display='none'; 
    bindingAction=null; 
    if(optionsOrigin === 'PAUSE'){
        document.getElementById('pause-menu').style.display='flex';
    } else {
        document.getElementById('main-menu').style.display='flex';
    }
}

function toggleOpt(key) { if(key==='sfx'){CONFIG.sfx=!CONFIG.sfx;document.getElementById('opt-sfx').innerText=CONFIG.sfx?"ON":"OFF";} if(key==='part'){CONFIG.particles=!CONFIG.particles;document.getElementById('opt-part').innerText=CONFIG.particles?"ON":"OFF";} }

const SKINS = [{name:"AZUL",body:"#36f",visor:"#000",detail:"#0af"},{name:"ROJO",body:"#f33",visor:"#300",detail:"#f88"},{name:"SOMBRA",body:"#333",visor:"#f00",detail:"#666"},{name:"PALADIN",body:"#ea0",visor:"#fff",detail:"#fd0"},{name:"TOXICO",body:"#4b4",visor:"#030",detail:"#bfb"},{name:"HIELO",body:"#0ff",visor:"#008",detail:"#fff"}];
let p1SkinIdx = 0, p2SkinIdx = 1;
function changeSkin(pid, dir) { if(pid===1) { p1SkinIdx = (p1SkinIdx+dir+SKINS.length)%SKINS.length; updatePreview(1); } else { p2SkinIdx = (p2SkinIdx+dir+SKINS.length)%SKINS.length; updatePreview(2); } }
function updatePreview(pid) { let s=SKINS[pid===1?p1SkinIdx:p2SkinIdx], el=document.getElementById(pid===1?'p1-preview':'p2-preview'); document.getElementById(pid===1?'p1-skin-name':'p2-skin-name').innerText=s.name; el.style.backgroundColor=s.body; el.style.boxShadow=`inset 0 0 0 4px ${s.detail}`; el.innerHTML=`<div style="width:100%; height:30%; background:${s.visor}; position:absolute; top:20%;"></div>`; }

const CLASSES = [
    {id:'WARRIOR', name:'GUERRERO', desc:'+20HP, +Armor'},
    {id:'SCOUT', name:'CAZADOR', desc:'+Velocidad'},
    {id:'TANK', name:'TANQUE', desc:'+50 Armor, Lento, Escudo'},
    {id:'MAGE', name:'MAGO', desc:'-20HP, CD Rápido'}
];
let p1ClassIdx = 0, p2ClassIdx = 0;
function changeClass(pid, dir) { if(pid===1) { p1ClassIdx = (p1ClassIdx+dir+CLASSES.length)%CLASSES.length; updateClassUI(1); } else { p2ClassIdx = (p2ClassIdx+dir+CLASSES.length)%CLASSES.length; updateClassUI(2); } }
function updateClassUI(pid) { let c = CLASSES[pid===1?p1ClassIdx:p2ClassIdx]; document.getElementById(pid===1?'p1-class-name':'p2-class-name').innerText=c.name; document.getElementById(pid===1?'p1-class-desc':'p2-class-desc').innerText=c.desc; }
updatePreview(1); updatePreview(2); updateClassUI(1); updateClassUI(2);

const BIOMES = [ 
    {name:"CRIPTA",bg:"#15151a",floor:"#1a1a1a",wall:"#334",boss:"REY ESQUELETO",bossColor:"#ccc",bossType:'SKELETON'}, 
    {name:"BOSQUE",bg:"#0a100a",floor:"#152015",wall:"#203020",boss:"GOLEM MADERA",bossColor:"#642",bossType:'GOLEM'}, 
    {name:"MAGMA",bg:"#150505",floor:"#251010",wall:"#502020",boss:"DEMONIO MAGMA",bossColor:"#f00",bossType:'DEMON'},
    {name:"OSARIO",bg:"#1a1515",floor:"#2a2525",wall:"#eec",boss:"LICHE",bossColor:"#ffe",bossType:'SKELETON'}
];
const WEAPONS = {
    FIST:{id:0,name:"PUÑOS",dmg:10,range:40,cd:18,type:'melee',color:'#fa0',recoil:0,cost:0,shake:0}, 
    SWORD:{id:1,name:"ESPADA",dmg:40,range:65,cd:40,type:'melee',color:'#ccc',recoil:1,cost:100,shake:0}, 
    AXE:{id:2,name:"HACHA",dmg:80,range:65,cd:75,type:'melee',color:'#a44',recoil:3,cost:150,shake:2}, 
    SPEAR:{id:3,name:"LANZA",dmg:30,range:125,cd:30,type:'melee',color:'#88a',recoil:1,cost:120,shake:0}, 
    SHIELD:{id:4,name:"ESCUDO",dmg:10,range:50,cd:20,type:'melee',color:'#44a',recoil:0,cost:100,shake:0}, 
    KATANA:{id:7,name:"KATANA",dmg:45,range:80,cd:15,type:'melee',color:'#aaf',recoil:-5,cost:400,legendary:true,shake:0},
    BOW:{id:5,name:"ARCO",dmg:32,range:500,cd:45,type:'ranged',color:'#853',recoil:3,cost:150,shake:0}, 
    REVOLVER:{id:6,name:"REVOLVER",dmg:60,range:450,cd:45,type:'ranged',color:'#da2',recoil:5,maxAmmo:6,reloadTime:150,cost:150,shake:2}, 
    STAFF:{id:8,name:"VARA FUEGO",dmg:65,range:400,cd:60,type:'ranged',color:'#f50',recoil:4,cost:450,legendary:true,explosive:true,shake:3}, 
    CROSSBOW:{id:9,name:"BALLESTA",dmg:80,range:600,cd:80,type:'ranged',color:'#543',recoil:8,cost:350,legendary:true,pierce:true,shake:1},
    SHOTGUN:{id:14,name:"ESCOPETA",dmg:28,range:150,cd:60,type:'ranged',color:'#666',recoil:15,cost:200,count:5,spread:0.6,shake:6,maxAmmo:2,reloadTime:120}, 
    MJOLNIR:{id:10,name:"MJOLNIR",dmg:100,range:70,cd:60,type:'melee',color:'#eef',recoil:2,cost:1000,unique:true,shake:4,lightning:true},
    SCYTHE:{id:11,name:"GUADAÑA V.",dmg:60,range:90,cd:35,type:'melee',color:'#a0a',recoil:1,cost:1000,unique:true,shake:1,lifesteal:true},
    LAZR:{id:12,name:"LAZ-R",dmg:15,range:800,cd:5,type:'ranged',color:'#0ff',recoil:1,cost:1000,unique:true,shake:0,pierce:true},
    GOLDGUN:{id:13,name:"CAÑON ORO",dmg:500,range:1000,cd:200,type:'ranged',color:'#fd0',recoil:20,cost:1000,unique:true,shake:10,explosive:true}
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

function saveGame() {
    if(state !== 'PAUSED') return;
    const save = {
        wave, gold, gameMode, isCoop,
        p1: {
            skinIdx: p1SkinIdx, classIdx: p1ClassIdx, hp: p1.hp, maxHp: p1.maxHp, armor: p1.armor,
            inventory: p1.inventory, weaponLevels: p1.weaponLevels, relics: p1.relics,
            weaponEnchants: p1.weaponEnchants, hasShield: p1.hasShield, weaponKey: getWeaponKeyName(p1.weapon.id)
        },
        p2: {
            skinIdx: p2SkinIdx, classIdx: p2ClassIdx, hp: p2.hp, maxHp: p2.maxHp, armor: p2.armor,
            inventory: p2.inventory, weaponLevels: p2.weaponLevels, relics: p2.relics,
            weaponEnchants: p2.weaponEnchants, hasShield: p2.hasShield, weaponKey: getWeaponKeyName(p2.weapon.id),
            alive: p2.alive
        }
    };
    localStorage.setItem('pd_save_data', JSON.stringify(save));
    floatTexts.push(new FloatText(500, 350, "PROGRESO GUARDADO!", "#0f0", 20));
    setTimeout(() => alert("Juego Guardado Correctamente"), 100);
}

function loadGame() {
    const dataStr = localStorage.getItem('pd_save_data');
    if(!dataStr) return;
    const save = JSON.parse(dataStr);
    
    if(audioCtx.state==='suspended')audioCtx.resume();
    wave = save.wave; gold = save.gold; gameMode = save.gameMode; isCoop = save.isCoop;
    
    // UI Restoration
    p1SkinIdx = save.p1.skinIdx; p1ClassIdx = save.p1.classIdx;
    p2SkinIdx = save.p2.skinIdx; p2ClassIdx = save.p2.classIdx;
    
    startGame(isCoop); // Re-inits everything
    
    // Overwrite with save data
    const applyData = (p, d) => {
        p.hp = d.hp; p.maxHp = d.maxHp; p.armor = d.armor;
        p.inventory = d.inventory; p.weaponLevels = d.weaponLevels;
        p.relics = d.relics; p.weaponEnchants = d.weaponEnchants;
        p.hasShield = d.hasShield;
        if(d.weaponKey && WEAPONS[d.weaponKey]) p.weapon = WEAPONS[d.weaponKey];
        if(p.id === 2) p.alive = d.alive;
    };
    
    applyData(p1, save.p1);
    applyData(p2, save.p2);
    
    updateInventoryUI();
    updateRelicUI();
    document.getElementById('btn-continue').style.display='none';
}

function deleteGame() {
    if(confirm("¿Seguro que quieres borrar tu progreso?")) {
        localStorage.removeItem('pd_save_data');
        document.getElementById('btn-continue').style.display='none';
    }
}

let currentMission = null;
const MISSIONS = [
    {type:'kill_melee', target:5, desc:"MATA 5 A MELÉ", reward:'gold'},
    {type:'no_hit', target:1, desc:"COMPLETA SIN DAÑO", reward:'gold'},
    {type:'kill_shooter', target:3, desc:"CAZA 3 TIRADORES", reward:'gold'},
    {type:'kill_elite', target:1, desc:"ELIMINA 1 ELITE", reward:'gold'}
];
function startMission() {
    if(wave <= 3 || wave%5===0 || gameMode==='SANDBOX'){ currentMission=null; document.getElementById('mission-hud').style.display='none'; return; }
    let m = MISSIONS[Math.floor(Math.random()*MISSIONS.length)];
    currentMission = { ...m, progress: 0, completed: false, failed: false };
    updateMissionHUD();
    document.getElementById('mission-hud').style.display='block';
}
function checkMission(evt, val=1) {
    if(!currentMission || currentMission.completed || currentMission.failed) return;
    if(currentMission.type === evt) {
        currentMission.progress += val;
        if(currentMission.progress >= currentMission.target) completeMission();
    }
    if(evt === 'damage') { currentMission.failed = true; updateMissionHUD(); }
    updateMissionHUD();
}
function completeMission() {
    currentMission.completed = true; playSfx('mission'); updateMissionHUD();
    gold += 150; floatTexts.push(new FloatText(500, 350, "+150 ORO DE MISION!", "#ff0"));
    if(gameMode === 'MADMAN') madmanTimer += 30*60; // Bonus time
}
function updateMissionHUD() {
    let el = document.getElementById('mission-desc');
    let pr = document.getElementById('mission-progress');
    let d = document.getElementById('mission-hud');
    if(!currentMission) { d.style.display='none'; return; }
    if(currentMission.failed) { el.innerText = "MISION FALLIDA"; el.style.color="#f00"; pr.innerText=""; }
    else if(currentMission.completed) { el.innerText = "MISION COMPLETADA"; el.classList.add('mission-complete'); pr.innerText=""; }
    else { el.innerText = currentMission.desc; el.style.color="#fe0"; el.classList.remove('mission-complete'); pr.innerText = `[${currentMission.progress}/${currentMission.target}]`; }
}

class Particle{constructor(x,y,color,vx,vy,life,size=2){this.x=x;this.y=y;this.color=color;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;this.size=size;}update(){this.x+=this.vx;this.y+=this.vy;this.life--;}draw(c){c.globalAlpha=this.life/this.maxLife;c.fillStyle=this.color;c.fillRect(this.x,this.y,this.size,this.size);c.globalAlpha=1;}}
class FloatText{constructor(x,y,text,color,size=10){this.x=x;this.y=y;this.text=text;this.color=color;this.life=40;this.vy=-1.5;this.size=size}update(){this.y+=this.vy;this.vy*=0.9;this.life--;}draw(c){c.globalAlpha=Math.min(1,this.life/10);c.fillStyle=this.color;c.font=`${this.size}px 'Press Start 2P'`;c.fillText(this.text,this.x-c.measureText(this.text).width/2,this.y);c.globalAlpha=1;}}
class Decal{constructor(x,y,color,size){this.x=x;this.y=y;this.color=color;this.size=size;}draw(c){c.globalAlpha=0.6;c.fillStyle=this.color;c.fillRect(this.x,this.y,this.size,this.size);c.globalAlpha=1;}}
class Trap{constructor(x,y){this.x=x;this.y=y;this.w=30;this.h=30;this.state=0;this.timer=Math.random()*100;this.cycle=200;}update(){this.timer++;let m=this.timer%this.cycle;if(m<100)this.state=0;else if(m<140)this.state=1;else this.state=2;}draw(c){if(this.state===0){c.fillStyle='#222';c.fillRect(this.x,this.y,this.w,this.h);}else if(this.state===1){c.fillStyle='#422';c.fillRect(this.x,this.y,this.w,this.h);c.fillStyle='#f00';c.fillRect(this.x+10,this.y+10,10,10);}else{c.fillStyle='#555';c.fillRect(this.x,this.y,this.w,this.h);c.fillStyle='#bbb';c.beginPath();c.moveTo(this.x+5,this.y+25);c.lineTo(this.x+15,this.y+5);c.lineTo(this.x+25,this.y+25);c.fill();}}}

function spawnParticles(x,y,c,count,spd,size=2){if(!CONFIG.particles)return;for(let i=0;i<count;i++){let a=Math.random()*6.28,s=Math.random()*spd;particles.push(new Particle(x,y,c,Math.cos(a)*s,Math.sin(a)*s,20+Math.random()*20,size));}}
function addShake(a){screenShake=Math.min(screenShake+a,20);}

class Player {
    constructor(id, skin, classType) {
        this.id=id; this.skin=skin; this.x=id===1?400:600; this.y=350;
        this.hp=100; this.maxHp=100; this.armor=0; this.maxArmor=50; this.w=20; this.h=20;
        this.weapon=WEAPONS.SWORD; this.inventory=['SWORD']; this.weaponLevels={SWORD:1};
        this.weaponEnchants={}; 
        this.relics=[]; this.hasShield=false;
        this.atkTimer=0; this.animTimer=0; this.animMax=0; this.angle=0; this.alive=true;
        this.vx=0; this.vy=0; this.ammo=6; this.reloadTimer=0; this.dashTimer=0; this.dashCd=0; this.isReflecting=false; this.walkCycle=0;
        this.classType = classType;
        this.dodgeCharges = 3; this.dodgeTimer = 0;
        this.comboStep = 0; this.comboTimer = 0;

        // CLASS LOGIC
        if(classType === 'WARRIOR') { this.hp=120; this.maxHp=120; this.armor=20; }
        if(classType === 'TANK') { this.hp=150; this.maxHp=150; this.armor=50; this.hasShield=true; this.inventory.push('SHIELD'); }
        if(classType === 'MAGE') { this.hp=80; this.maxHp=80; }

        // MADMAN MODE OVERRIDE
        if(gameMode === 'MADMAN') {
            this.inventory = ['FIST']; this.weapon = WEAPONS.FIST; this.weaponLevels={FIST:1};
        } else if(gameMode === 'SANDBOX') {
            this.hp = 10000; this.maxHp = 10000; this.armor = 1000;
            this.inventory = Object.keys(WEAPONS).map(k=>k);
            this.relics = RELICS.map(r=>r.id);
            this.hasShield = true;
            this.inventory.forEach(k => this.weaponLevels[k]=5);
        }
    }
    hasRelic(id) { return this.relics.includes(id); }
    hasEnchant(id) { 
        let list = this.weaponEnchants[this.weapon.name];
        return list && list.includes(id); 
    }
}

function startGame(coop) {
    if(audioCtx.state==='suspended')audioCtx.resume();
    isCoop=coop; state='PLAYING'; gameTick=0; gold=0; wave=1;
    
    // SETUP MADMAN
    if(gameMode === 'MADMAN') {
        madmanTimer = 3600; // 60 seconds
        document.getElementById('madman-timer').style.display = 'block';
    } else {
        document.getElementById('madman-timer').style.display = 'none';
    }

    // SANDBOX UI
    document.getElementById('sandbox-controls').style.display = (gameMode === 'SANDBOX') ? 'block' : 'none';
    if(gameMode === 'SANDBOX') gold = 999999;

    p1=new Player(1, SKINS[p1SkinIdx], CLASSES[p1ClassIdx].id); 
    p2=new Player(2, SKINS[p2SkinIdx], CLASSES[p2ClassIdx].id);
    if(!isCoop)p2.alive=false;
    document.getElementById('main-menu').style.display='none';
    document.getElementById('p2-hud-area').style.display = isCoop ? 'block' : 'none';
    document.getElementById('coop-msg').style.display = isCoop ? 'inline' : 'none';
    spawnLevel(); loop();
    updateRelicUI();
    updateInventoryUI();
}
function togglePause(){ if(state==='PLAYING'){state='PAUSED';document.getElementById('pause-menu').style.display='flex';}else if(state==='PAUSED'){state='PLAYING';document.getElementById('pause-menu').style.display='none';} }
function gameOver(){ 
    state='GAMEOVER'; 
    localStorage.removeItem('pd_save_data'); // PERMADEATH
    document.getElementById('game-over-menu').style.display='flex'; 
    document.getElementById('death-wave').innerText=wave; 
    document.getElementById('death-gold').innerText=gold; 
}

function spawnLevel() {
    enemies=[]; projectiles=[]; enemyBullets=[]; structures=[]; warnings=[]; particles=[]; floatTexts=[]; decals=[]; traps=[];
    currentBiome=BIOMES[Math.floor((wave-1)/5)%BIOMES.length];
    document.getElementById('biome-txt').innerText=currentBiome.name;
    enemyPower=1+(wave*0.08); 
    document.getElementById('diff-txt').innerText="PODER ENEMIGO: "+Math.round(enemyPower*100)+"%";
    
    startMission();

    // MÚSICA Y SPAWN DE JEFE
    if(wave % 5 === 0) {
        playBossMusic(wave); // <-- Esta línea activa tus archivos .aac
        document.getElementById('boss-alert').style.display='block'; 
        setTimeout(()=>document.getElementById('boss-alert').style.display='none', 2000);
        
        let cd=600; 
        enemies.push({
            x:500, y:100, w:60, h:60, 
            hp:(1000+wave*100)*enemyPower, 
            maxHp:(1000+wave*100)*enemyPower, 
            speed:0.8, color:currentBiome.bossColor, 
            type:'BOSS', bossSubType:currentBiome.bossType, 
            flash:0, abilityTimer:cd, abilityMax:cd, walkCycle:0
        });
    } else {
        // Enemigos normales
        let total = (isCoop?6:5)+Math.floor(wave*1.5);
        for(let i=0; i<total; i++) {
            let type = Math.random()<0.3 ? 'SHOOTER' : 'GRUNT';
            let s = getEnemyStats(type);
            enemies.push({
                x:Math.random()*1000, y:Math.random()<0.5?-50:750, 
                w:s.size, h:s.size, hp:s.hp*enemyPower, maxHp:s.hp*enemyPower, 
                speed:s.speed, color:s.color, type:type, flash:0, walkCycle:0
            });
        }
    }
    
    // SANDBOX: NO STRUCTURES, ONLY BOT
    if(gameMode === 'SANDBOX') {
        enemies.push({x:500,y:200,w:30,h:30,hp:10000,maxHp:10000,speed:1.5,color:'#888',type:'DUMMY',flash:0,range:200,reload:60,cd:0,walkCycle:0});
        return; 
    }

    let safe=150, att=0;
    function addSt(rs){let v=true;for(let r of rs){if(Math.hypot(r.x+r.w/2-500,r.y+r.h/2-350)<safe)v=false;if(r.x<50||r.x+r.w>950||r.y<50||r.y+r.h>650)v=false;for(let s of structures)if(r.x<s.x+s.w+40&&r.x+r.w+40>s.x&&r.y<s.y+s.h+40&&r.y+r.h+40>s.y)v=false;}if(v){rs.forEach(r=>structures.push(r));return true;}return false;}
    while(structures.length<15&&att<200){att++;let t=Math.floor(Math.random()*4),x=50+Math.random()*850,y=50+Math.random()*550,s=[];if(t===0)s.push({x:x,y:y,w:40+Math.random()*40,h:40+Math.random()*40});else if(t===1){s.push({x:x,y:y,w:100,h:30});s.push({x:x+35,y:y-35,w:30,h:100});}else if(t===2){s.push({x:x,y:y,w:30,h:100});s.push({x:x,y:y+70,w:80,h:30});}else if(t===3){s.push({x:x,y:y,w:30,h:30});s.push({x:x+60,y:y,w:30,h:30});}addSt(s);}

    if(wave%5===0) {
        for(let i=0; i<10; i++) traps.push(new Trap(100+Math.random()*800, 100+Math.random()*500));
        let cd=currentBiome.bossType==='DEMON'?480:(currentBiome.bossType==='GOLEM'?900:600);
        enemies.push({x:500,y:100,w:60,h:60,hp:(1000+wave*100)*enemyPower,maxHp:(1000+wave*100)*enemyPower,speed:0.8,color:currentBiome.bossColor,type:'BOSS',bossSubType:currentBiome.bossType,flash:0,range:400,abilityTimer:cd,abilityMax:cd,walkCycle:0});
        document.getElementById('biome-txt').innerText="JEFE: "+currentBiome.boss;
    } else {
        let total = (isCoop?6:5)+Math.floor(wave*1.5);
        let list = [];
        let elites = Math.floor(total * 0.1);
        let tanks = Math.floor(total * 0.2);
        let shooters = Math.floor(total * 0.3);
        let grunts = total - elites - tanks - shooters;
        for(let i=0; i<elites; i++) list.push({t:'GRUNT', elite:true}); 
        for(let i=0; i<tanks; i++) list.push({t:'TANK', elite:false});
        for(let i=0; i<grunts; i++) list.push({t:'GRUNT', elite:false});
        for(let i=0; i<shooters; i++) list.push({t:'SHOOTER', elite:false});
        list.forEach(def => {
            let s=getEnemyStats(def.t);
            let hp = s.hp * enemyPower * (def.elite?2.5:1);
            let speed = s.speed*(def.elite?1.2:1)*(0.9+Math.random()*0.2);
            enemies.push({x:Math.random()*1000,y:Math.random()<0.5?-50:750,w:s.size*(def.elite?1.5:1),h:s.size*(def.elite?1.5:1),hp:hp, maxHp:hp, speed:speed,color:def.elite?'#fff':s.color,type:def.t, flash:0, range:350, reload:120, cd:Math.random()*100, walkCycle:Math.random()*10, elite:def.elite});
        });
    }
}
function getEnemyStats(t){switch(t){case 'TANK':return{hp:200,speed:0.5,size:30,color:'#522'};case 'SPEED':return{hp:50,speed:1.8,size:15,color:'#dd0'};case 'SHOOTER':return{hp:70,speed:0.7,size:20,color:'#a0a'};default:return{hp:100,speed:0.9,size:20,color:'#383'};}}
function getWeaponStats(p){
    let b=p.weapon,l=p.weaponLevels[b.name]||1; 
    let dmgMult = p.hasRelic('rage') && (p.hp/p.maxHp < 0.5) ? 1.2 : 1.0; 
    if(p.hasRelic('glass')) dmgMult += 0.4; 
    if(p.hasEnchant('sharp')) dmgMult += 0.25;

    let cdMult = 1.0; 
    if(p.classType === 'MAGE') cdMult = 0.8;
    if(p.hasEnchant('haste')) cdMult -= 0.15;

    let rngMult = 1.0;
    if(p.hasEnchant('sniper')) rngMult += 0.3;

    let recoilMult = 1.0;
    if(p.hasEnchant('heavy')) recoilMult = 1.5;

    let finalMaxAmmo = b.maxAmmo;
    if(b.maxAmmo && p.hasEnchant('ammo')) finalMaxAmmo += 3;

    return {...b, 
        dmg:b.dmg*(1+(l-1)*0.15)*dmgMult, 
        cd:(b.cd*Math.pow(0.95,l-1))*cdMult, 
        range: b.range * rngMult,
        recoil: b.recoil * recoilMult,
        maxAmmo: finalMaxAmmo,
        level:l
    };
}

function resolveCollisions(e,nx,ny){e.x=nx;e.y=ny;structures.forEach(s=>{if(e.x<s.x+s.w&&e.x+e.w>s.x&&e.y<s.y+s.h&&e.y+e.h>s.y){let l=(e.x+e.w)-s.x,r=(s.x+s.w)-e.x,t=(e.y+e.h)-s.y,b=(s.y+s.h)-e.y,m=Math.min(l,r,t,b);if(m===l)e.x-=l;else if(m===r)e.x+=r;else if(m===t)e.y-=t;else if(m===b)e.y+=b;}});e.x=Math.max(0,Math.min(1000-e.w,e.x));e.y=Math.max(0,Math.min(700-e.h,e.y));}

function update() {
    if(state!=='PLAYING')return;
    gameTick++; if(screenShake>0){screenShake*=0.9;if(screenShake<0.5)screenShake=0;}
    
    // MADMAN TIMER
    if(gameMode === 'MADMAN') {
        madmanTimer--;
        document.getElementById('madman-timer').innerText = "TIEMPO: " + Math.ceil(madmanTimer/60);
        if(madmanTimer <= 0) gameOver();
    }

    for(let i=particles.length-1;i>=0;i--){particles[i].update();if(particles[i].life<=0)particles.splice(i,1);}
    for(let i=floatTexts.length-1;i>=0;i--){floatTexts[i].update();if(floatTexts[i].life<=0)floatTexts.splice(i,1);}
    for(let i=warnings.length-1;i>=0;i--){warnings[i].life--;if(warnings[i].life<=0)warnings.splice(i,1);}
    traps.forEach(tr => tr.update());

    [p1,p2].forEach(p=>{
        if(!p.alive)return;
        
        // SANDBOX GOD MODE REGEN
        if(gameMode === 'SANDBOX') { p.hp = p.maxHp; p.armor = 1000; }

        if(p.hasRelic('dodge') && p.dodgeCharges <= 0) {
            p.dodgeTimer--;
            if(p.dodgeTimer <= 0) { p.dodgeCharges = 3; floatTexts.push(new FloatText(p.x, p.y-20, "ESQUIVE LISTO", "#0ff")); playSfx('reload'); }
        }
        if(p.hasRelic('regen') && gameTick % 300 === 0 && p.hp < p.maxHp) { p.hp = Math.min(p.hp+1, p.maxHp); floatTexts.push(new FloatText(p.x, p.y-10, "+1", "#0f0")); }
        
        p.vx*=0.8;p.vy*=0.8;
        let dx=0,dy=0;
        let baseSpd = 1.8;
        if(p.hasRelic('speed')) baseSpd *= 1.15;
        if(p.classType === 'SCOUT') baseSpd *= 1.15;
        if(p.classType === 'TANK') baseSpd *= 0.9;
        if(p.hasEnchant('feather')) baseSpd *= 1.1;

        let up,down,left,right,atk,dash,shield;
        if(p.id===1){
            up=keys[KEYBINDS.p1_up];down=keys[KEYBINDS.p1_down];left=keys[KEYBINDS.p1_left];right=keys[KEYBINDS.p1_right];atk=keys[KEYBINDS.p1_atk];dash=keys[KEYBINDS.p1_dash];shield=keys[KEYBINDS.p1_shield];
            // ALL KEYS 1-9 for sandbox weapon switch
            ['1','2','3','4','5','6','7','8','9'].forEach(k=>{if(keys[k])switchWeapon(p,parseInt(k));}); 
        } else {
            up=keys[KEYBINDS.p2_up];down=keys[KEYBINDS.p2_down];left=keys[KEYBINDS.p2_left];right=keys[KEYBINDS.p2_right];atk=keys[KEYBINDS.p2_atk];dash=keys[KEYBINDS.p2_dash];shield=keys[KEYBINDS.p2_shield];
        }
        if(p.reloadTimer>0){p.reloadTimer -= (p.hasRelic('ammo')?2:1); if(p.reloadTimer<=0){p.ammo=getWeaponStats(p).maxAmmo||6;playSfx('reload');}}

        if(dash&&p.dashCd<=0){p.dashTimer=15;p.dashCd=300;playSfx('dash');let ma=(dx===0&&dy===0)?p.angle:Math.atan2(dy,dx);if(dx!==0||dy!==0)ma=Math.atan2(dy,dx);p.vx=Math.cos(ma)*12;p.vy=Math.sin(ma)*12;spawnParticles(p.x+p.w/2,p.y+p.h/2,'#fff',5,1);}
        if(p.dashTimer>0){p.dashTimer--;if(gameTick%3===0)spawnParticles(p.x,p.y,p.skin.body,1,0,2);} if(p.dashCd>0)p.dashCd--;
        if(p.dashTimer<=0){if(up)dy-=baseSpd;if(down)dy+=baseSpd;if(left)dx-=baseSpd;if(right)dx+=baseSpd;if(dx!==0||dy!==0)p.walkCycle+=0.2;else p.walkCycle=0;}
        
        p.isReflecting=false;
        if((p.hasShield || p.inventory.includes('SHIELD')) && shield) { p.isReflecting=true; dx*=0.5; dy*=0.5; }

        let tg=getNearestEnemy(p); if(tg)p.angle=Math.atan2((tg.y+tg.h/2)-(p.y+p.h/2),(tg.x+tg.w/2)-(p.x+p.w/2)); else if(dx!==0||dy!==0)p.angle=Math.atan2(dy,dx);
        resolveCollisions(p,p.x+dx+p.vx,p.y+dy+p.vy);
        
        traps.forEach(tr => {
            if(tr.state===2 && Math.hypot((tr.x+15)-(p.x+10), (tr.y+15)-(p.y+10)) < 20) {
                 if(p.dashTimer>0) return;
                 if(p.hasRelic('dodge') && p.dodgeCharges > 0) {
                    if(gameTick%30===0){
                        p.dodgeCharges--; if(p.dodgeCharges<=0) p.dodgeTimer=600;
                        floatTexts.push(new FloatText(p.x, p.y-10, "ESQUIVA TRAMPA!", "#0ff", 8));
                    }
                 } else if(gameTick%30===0) {
                     let tdmg = 10; if(p.armor>0)p.armor=Math.max(0,p.armor-tdmg); else p.hp-=tdmg;
                     floatTexts.push(new FloatText(p.x,p.y,"-10",'#f00')); playSfx('hit');
                     if(p.hp<=0)p.alive=false;
                 }
            }
        });

        if(p.atkTimer>0)p.atkTimer--; if(p.animTimer>0)p.animTimer--;
        if(atk) performAttack(p);
    });

    // AI LOGIC IMPROVEMENT
    enemies.forEach((en, idx)=>{
        if(en.type === 'DUMMY') {
             en.hp = en.maxHp; // INFINITE HP DUMMY
             if(!sandboxBotAggro) return; // DO NOTHING IF PASSIVE
        }

        let t=isCoop?(p1.alive&&p2.alive?(Math.hypot(p1.x-en.x,p1.y-en.y)<Math.hypot(p2.x-en.x,p2.y-en.y)?p1:p2):(p1.alive?p1:p2)):p1;
        if(t&&t.alive){
            if(en.type==='BOSS')processBossAbilities(en,t);
            let cx=en.x+en.w/2,cy=en.y+en.h/2,tx=t.x+t.w/2,ty=t.y+t.h/2;
            let dist=Math.hypot(tx-cx,ty-cy);
            let ang = 0;

            // Prediction & AI Behavior
            if(en.type === 'SHOOTER'){
                if(dist < en.range - 100) { 
                    ang = Math.atan2(cy - ty, cx - tx); // Flee
                } else if(dist < en.range) {
                    ang = Math.atan2(ty - cy, tx - cx) + Math.PI/2; // Strafe
                } else {
                    ang = Math.atan2(ty - cy, tx - cx); // Chase
                }
            } else {
                // Melee Prediction
                let predX = tx + t.vx * 15;
                let predY = ty + t.vy * 15;
                ang = Math.atan2(predY - cy, predX - cx);
            }

            let sepX=0, sepY=0;
            enemies.forEach((other, oIdx)=>{
                if(idx!==oIdx){
                    let d = Math.hypot((en.x+en.w/2)-(other.x+other.w/2), (en.y+en.h/2)-(other.y+other.h/2));
                    if(d < 40){
                        let pushAng = Math.atan2((en.y+en.h/2)-(other.y+other.h/2), (en.x+en.w/2)-(other.x+other.w/2));
                        sepX += Math.cos(pushAng) * 1.5;
                        sepY += Math.sin(pushAng) * 1.5;
                    }
                }
            });
            
            let mv=true;
            if(en.type==='SHOOTER'){
                if(en.cd>0)en.cd--;else{
                    // Shoot towards actual player, not predicted spot always
                    let shootAng = Math.atan2(ty - cy, tx - cx);
                    enemyBullets.push({x:cx,y:cy,vx:Math.cos(shootAng)*5,vy:Math.sin(shootAng)*5,size:6,dmg:15*enemyPower});
                    en.cd=en.reload;playSfx('shoot');
                }
            }
            if(mv){
                let edx = (Math.cos(ang) + sepX) * en.speed;
                let edy = (Math.sin(ang) + sepY) * en.speed;
                resolveCollisions(en, en.x+edx, en.y+edy);
                en.walkCycle+=en.speed*0.2;
            }
            if(Math.hypot(tx-cx,ty-cy)<25){
                if(t.dashTimer>0)return;
                if(t.isReflecting){
                    playSfx('block');en.x-=Math.cos(ang)*50;en.y-=Math.sin(ang)*50;spawnParticles(cx,cy,'#4af',10,3);
                    if(t.hasRelic('thorns')){en.hp-=10;en.flash=3;floatTexts.push(new FloatText(en.x,en.y,"10","#eee"));} 
                    return;
                }
                
                if(t.hasRelic('dodge') && t.dodgeCharges > 0) {
                    t.dodgeCharges--; if(t.dodgeCharges<=0) t.dodgeTimer=600; 
                    floatTexts.push(new FloatText(t.x, t.y-10, "ESQUIVA!", "#0ff", 8)); playSfx('dash'); spawnParticles(t.x, t.y, '#0ff', 5, 2); return;
                }

                let dmg=(en.type==='TANK'?1:(en.type==='BOSS'?1.5:0.5))*enemyPower;
                
                // Player Enchant Tank Armor
                let pArmor = t.armor + (t.hasEnchant('tank') ? 20 : 0);

                if(pArmor>0){ t.armor = Math.max(0, t.armor-dmg); } else t.hp-=dmg;

                floatTexts.push(new FloatText(t.x+10,t.y,"-"+Math.floor(dmg),'#f00'));addShake(2); checkMission('damage');
                if(t.hasRelic('thorns')){en.hp-=dmg;en.flash=3;floatTexts.push(new FloatText(en.x,en.y,Math.floor(dmg),"#eee"));}
                if(t.hp<=0)t.alive=false;
            }
        }
        if(en.flash>0)en.flash--;
    });

    projectiles.forEach((b,i)=>{
        b.x+=b.vx;b.y+=b.vy;let hit=false;
        structures.forEach(st=>{if(b.x>st.x&&b.x<st.x+st.w&&b.y>st.y&&b.y<st.y+st.h){hit=true;spawnParticles(b.x,b.y,'#aaa',5,2);}});
        if(b.x<0||b.x>1000||b.y<0||b.y>700) hit=true;

        enemies.forEach((en,j)=>{
            if(!hit&&b.x>en.x&&b.x<en.x+en.w&&b.y>en.y&&b.y<en.y+en.h){
                let dmg=b.dmg; en.hp-=dmg; en.flash=3; 
                let txtCol = b.isCrit ? '#f80' : '#ff0';
                let txtSz = b.isCrit ? 16 : 10;
                floatTexts.push(new FloatText(en.x+en.w/2,en.y,Math.floor(dmg),txtCol,txtSz));
                spawnParticles(b.x,b.y,en.color,8,4);
                
                // Enchant Effects
                if(b.owner) {
                    if(b.owner.hasEnchant('vampire') && Math.random() < 0.05) { b.owner.hp = Math.min(b.owner.hp+5, b.owner.maxHp); floatTexts.push(new FloatText(b.owner.x, b.owner.y-20, "VAMPIRO", "#f00")); }
                    if(b.owner.hasEnchant('thunder') && Math.random() < 0.2) b.lightning = true;
                    if(b.owner.hasEnchant('explosive') && Math.random() < 0.1) b.explosive = true;
                }

                if(b.lightning) {
                    enemies.forEach(subEn => {
                         if(subEn!==en && Math.hypot(subEn.x-en.x, subEn.y-en.y) < 150) {
                             subEn.hp -= dmg/2; subEn.flash=3; 
                             floatTexts.push(new FloatText(subEn.x+subEn.w/2,subEn.y,Math.floor(dmg/2),'#0af'));
                             ctx.strokeStyle='#0ff'; ctx.beginPath(); ctx.moveTo(en.x+en.w/2,en.y+en.h/2); ctx.lineTo(subEn.x+subEn.w/2,subEn.y+subEn.h/2); ctx.stroke();
                         }
                    });
                }
                if(b.explosive){playSfx('explo');addShake(5);spawnParticles(b.x,b.y,'#f50',20,6,4);enemies.forEach(se=>{if(Math.hypot(se.x-b.x,se.y-b.y)<100){se.hp-=b.dmg/2;floatTexts.push(new FloatText(se.x+se.w/2,se.y,Math.floor(b.dmg/2),'#f80'));}});}
                en.x+=b.vx*0.5;en.y+=b.vy*0.5; if(!b.pierce){projectiles.splice(i,1);hit=true;}
                if(en.hp<=0 && !en.dead){
                    en.dead = true; 
                    if(en.type === 'BOSS'){
                        openEnchantMenu(b.owner); // Trigger Enchant Menu
                    }
                    if(b.owner && b.owner.weapon.type === 'melee') checkMission('kill_melee');
                    if(en.type === 'SHOOTER') checkMission('kill_shooter');
                    if(en.elite) checkMission('kill_elite');
                    
                    // MADMAN DROP LOGIC
                    if(gameMode === 'MADMAN' && Math.random() < 0.3) { 
                        let lootKeys = ['SWORD', 'REVOLVER', 'BOW', 'AXE'];
                        let k = lootKeys[Math.floor(Math.random()*lootKeys.length)];
                        if(b.owner && b.owner.inventory.length < 5 && !b.owner.inventory.includes(k)) {
                            b.owner.inventory.push(k); b.owner.weaponLevels[k]=1;
                            floatTexts.push(new FloatText(b.owner.x, b.owner.y-20, "ARMA ENCONTRADA", "#0f0"));
                            updateInventoryUI();
                        }
                    }

                    let gDrop=(en.type==='BOSS'?150:15)*(en.elite?3:1);
                    if(b.owner && b.owner.hasEnchant('greed')) gDrop *= 1.5;

                    gold+=Math.floor(gDrop);
                    playSfx('coin');addShake(3);spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color,30,5,3);for(let k=0;k<3;k++)decals.push(new Decal(en.x+Math.random()*20-10,en.y+Math.random()*20-10,Math.random()>0.5?en.color:'#511',5+Math.random()*10));
                    let killer = b.owner;
                    if(killer && killer.alive && (killer.hasRelic('vamp') || b.lifesteal) && killer.hp < killer.maxHp) { killer.hp = Math.min(killer.hp+2, killer.maxHp); floatTexts.push(new FloatText(killer.x, killer.y, "+2", "#0f0")); }
                }
            }
        });
        if(hit) projectiles.splice(i,1);
    });

    enemyBullets.forEach((b,i)=>{
        let hit=false;
        [p1,p2].forEach(p=>{
            if(p.alive&&p.isReflecting&&Math.hypot(b.x-(p.x+p.w/2),b.y-(p.y+p.h/2))<40){
                b.vx*=-1;b.vy*=-1; b.reflected=true; 
                playSfx('block');spawnParticles(b.x,b.y,'#4af',5,3);
            }
        });
        b.x+=b.vx;b.y+=b.vy;
        structures.forEach(st=>{if(b.x>st.x&&b.x<st.x+st.w&&b.y>st.y&&b.y<st.y+st.h){hit=true;spawnParticles(b.x,b.y,'#aaa',5,2);}});
        if(b.x<0||b.x>1000||b.y<0||b.y>700) hit=true;

        if(b.reflected) {
            enemies.forEach((en,j)=>{
                if(!hit && Math.hypot((en.x+en.w/2)-b.x, (en.y+en.h/2)-b.y) < en.w){
                    en.hp -= b.dmg * 2; en.flash=3;
                    floatTexts.push(new FloatText(en.x,en.y,Math.floor(b.dmg*2), "#0af"));
                    hit=true; enemyBullets.splice(i,1);
                    if(en.hp<=0 && !en.dead){ en.dead=true; gold+=15; }
                }
            });
        } else {
            [p1,p2].forEach(p=>{if(!hit&&p.alive&&b.x>p.x&&b.x<p.x+p.w&&b.y>p.y&&b.y<p.y+p.h){
                if(p.dashTimer>0||p.isReflecting)return;
                if(p.hasRelic('dodge') && p.dodgeCharges > 0) {
                    p.dodgeCharges--; if(p.dodgeCharges<=0) p.dodgeTimer=600; 
                    floatTexts.push(new FloatText(p.x, p.y-10, "ESQUIVA!", "#0ff", 8)); playSfx('dash'); spawnParticles(p.x, p.y, '#0ff', 5, 2); enemyBullets.splice(i,1); hit=true; return;
                }
                
                let pArmor = p.armor + (p.hasEnchant('tank') ? 20 : 0);
                if(pArmor>0){p.armor-=b.dmg/2;if(p.armor<0)p.armor=0;}else p.hp-=b.dmg;

                floatTexts.push(new FloatText(p.x+10,p.y,"-"+Math.floor(b.dmg),'#f00'));addShake(4);checkMission('damage'); enemyBullets.splice(i,1);hit=true;if(p.hp<=0)p.alive=false;
            }});
        }
        if(hit) enemyBullets.splice(i,1);
    });

    enemies = enemies.filter(e => !e.dead);

    if(!p1.alive&&(!isCoop||!p2.alive))gameOver();
    if(enemies.length===0 && state==='PLAYING')openShop();

    let s=getWeaponStats(p1);
    document.getElementById('hp-bar').style.width=Math.max(0,p1.hp/p1.maxHp*100)+'%';
    document.getElementById('arm-bar').style.width=Math.max(0,(p1.armor/p1.maxArmor)*100)+'%';
    document.getElementById('gold-txt').innerText=gold; document.getElementById('wave-txt').innerText=wave;
    document.getElementById('weapon-txt').innerText=`ARMA: ${s.name} (LVL ${s.level})`;
    document.getElementById('ammo-hud').innerText=(s.maxAmmo)?(p1.reloadTimer>0?"[ RECARGANDO ]":`BALAS: ${p1.ammo}/${s.maxAmmo}`):"";
    document.getElementById('shield-status').innerText = (p1.hasShield || p1.inventory.includes('SHIELD')) ? "[ESCUDO LISTO - 'R']" : "";
    if(isCoop) document.getElementById('p2-hp-bar').style.width = Math.max(0,p2.hp/p2.maxHp*100)+'%';
}

function getNearestEnemy(p){let n=null,md=Infinity;enemies.forEach(en=>{let d=Math.hypot(en.x-p.x,en.y-p.y);if(d<md){md=d;n=en;}});return n;}

function processBossAbilities(b,t){
    if(!t)return;b.abilityTimer--;
    if(b.abilityTimer<=0){
        b.abilityTimer=b.abilityMax; playSfx('boss');
        let attackType = Math.random() < 0.5 ? 'PRIMARY' : 'SECONDARY';
        if(b.bossSubType==='SKELETON'){
            if(attackType === 'PRIMARY') {
                showBossAlert("INVOCACION!");
                for(let i=0;i<2;i++){let ex=b.x+Math.random()*100-50,ey=b.y+Math.random()*100-50;enemies.push({x:ex,y:ey,w:20,h:20,hp:50*enemyPower,maxHp:50*enemyPower,speed:1,color:'#ccc',type:'GRUNT',flash:0,walkCycle:0});spawnParticles(ex,ey,'#ccc',15,2);}
            } else {
                showBossAlert("¡LLUVIA DE HUESOS!");
                for(let i=0; i<8; i++){ let a = i*(Math.PI/4); enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*4,vy:Math.sin(a)*4,size:8,dmg:20*enemyPower}); }
            }
        } 
        else if(b.bossSubType==='GOLEM'){
            if(attackType === 'PRIMARY') {
                showBossAlert("¡SALTO SISMICO!");
                let tx=t.x,ty=t.y;warnings.push({x:tx,y:ty,r:60,life:60});
                setTimeout(()=>{b.x=tx;b.y=ty;spawnParticles(b.x+30,b.y+30,'#642',50,8,4);playSfx('explo');addShake(10);for(let i=0;i<12;i++){let a=i*(3.14/6);enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*5,vy:Math.sin(a)*5,size:8,dmg:25*enemyPower});}},1000);
            } else {
                showBossAlert("¡ROCA GIGANTE!");
                let ang = Math.atan2(t.y-b.y, t.x-b.x);
                enemyBullets.push({x:b.x+30, y:b.y+30, vx:Math.cos(ang)*7, vy:Math.sin(ang)*7, size:25, dmg:40*enemyPower});
            }
        } 
        else if(b.bossSubType==='DEMON'){
            if(attackType === 'PRIMARY') {
                showBossAlert("RAYO MAGMA!");
                let a=Math.atan2((t.y+10)-(b.y+30),(t.x+10)-(b.x+30));for(let i=0;i<5;i++)setTimeout(()=>{enemyBullets.push({x:b.x+30,y:b.y+30,vx:Math.cos(a)*8,vy:Math.sin(a)*8,size:10,dmg:30*enemyPower});spawnParticles(b.x+30+Math.cos(a)*10,b.y+30+Math.sin(a)*10,'#f00',10,3);},i*100);
            } else {
                 showBossAlert("¡ZONA EXPLOSIVA!");
                 for(let i=0; i<3; i++) {
                     let rx = t.x + (Math.random()*200-100); let ry = t.y + (Math.random()*200-100);
                     warnings.push({x:rx,y:ry,r:40,life:60});
                     setTimeout(()=>{spawnParticles(rx+30,ry+30,'#f50',20,5); playSfx('explo'); if(Math.hypot(t.x-rx, t.y-ry)<50){t.hp-=30*enemyPower; floatTexts.push(new FloatText(t.x,t.y,"-30",'#f00'));}}, 1000);
                 }
            }
        }
    }
}

function showBossAlert(t){let e=document.getElementById('boss-alert');e.innerText=t;e.style.display='block';setTimeout(()=>e.style.display='none',2000);}
function switchWeapon(p,n){const m=[null,'SWORD','AXE','SPEAR','SHIELD','BOW','REVOLVER','KATANA','STAFF','CROSSBOW', 'MJOLNIR', 'SCYTHE', 'LAZR', 'GOLDGUN', 'SHOTGUN', 'FIST'];let k=m[n];
    // Special logic for keys > inventory length in Sandbox
    if(gameMode === 'SANDBOX' && n <= p.inventory.length) {
         p.weapon = WEAPONS[p.inventory[n-1]];
    } else if(k&&p.inventory.includes(k)) {
        p.weapon=WEAPONS[k]; 
    }
    updateInventoryUI();
}

function openEnchantMenu(player) {
    if(!player) return;
    state = 'ENCHANT';
    document.getElementById('enchant-menu').style.display='flex';
    document.getElementById('ench-weapon-name').innerText = player.weapon.name;
    
    const container = document.getElementById('enchant-container');
    container.innerHTML = '';
    playSfx('enchant');

    // Pick 3 random
    let options = [];
    let pool = [...ENCHANTS];
    for(let i=0; i<3; i++) {
        let idx = Math.floor(Math.random()*pool.length);
        options.push(pool[idx]);
        pool.splice(idx, 1);
    }

    options.forEach(ench => {
        let card = document.createElement('div');
        card.className = 'enchant-card';
        card.innerHTML = `
            <div class="ench-title">${ench.name}</div>
            <div class="ench-desc">${ench.desc}</div>
            <div class="ench-type">${ench.type}</div>
        `;
        card.onclick = () => {
            applyEnchant(player, ench.id);
        };
        container.appendChild(card);
    });
}

function applyEnchant(player, enchantId) {
    let wName = player.weapon.name;
    if(!player.weaponEnchants[wName]) player.weaponEnchants[wName] = [];
    player.weaponEnchants[wName].push(enchantId);
    
    document.getElementById('enchant-menu').style.display='none';
    floatTexts.push(new FloatText(player.x, player.y-40, "ARMA ENCANTADA!", "#f0f"));
    playSfx('reload'); // Reuse sound
    
    // Check if enemies dead to open shop immediately, else resume play
    if(enemies.length === 0) openShop();
    else state = 'PLAYING';
    
    updateInventoryUI();
}

function performAttack(p){
    // CLASSIC COMBAT: JUST COOLDOWN CHECK
    if(p.atkTimer>0)return; 
    
    let s=getWeaponStats(p);
    if(s.maxAmmo){if(p.reloadTimer>0)return;if(p.ammo<=0){p.reloadTimer=s.reloadTime;playSfx('reload');return;}p.ammo--;}
    
    let isCrit = Math.random() < 0.1;
    let finalDmg = s.dmg * (isCrit ? 2 : 1);

    // Set animation timers
    p.atkTimer = s.cd; 
    p.animTimer = s.cd; 
    p.animMax = s.cd;

    playSfx(s.name==='ESCOPETA'?'shotgun' : (s.type==='melee'?'swing':(s.explosive?'heavy_shoot':'shoot')));
    p.vx-=Math.cos(p.angle)*s.recoil;p.vy-=Math.sin(p.angle)*s.recoil; if(s.shake)addShake(s.shake);

    if(s.type==='melee'){
        let hx=p.x+p.w/2+Math.cos(p.angle)*30, hy=p.y+p.h/2+Math.sin(p.angle)*30;
        enemies.forEach((en,i)=>{if(Math.hypot(hx-en.x-en.w/2,hy-en.y-en.h/2)<s.range){
            en.hp-=finalDmg;en.flash=3;playSfx('hit');addShake(2);
            let txtCol = isCrit ? '#f80' : '#ff0'; let txtSz = isCrit ? 16 : 10;
            floatTexts.push(new FloatText(en.x+en.w/2,en.y,Math.floor(finalDmg),txtCol, txtSz));
            spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color,10,4);en.x+=Math.cos(p.angle)*10;en.y+=Math.sin(p.angle)*10;
            if(s.lightning) {
                enemies.forEach(subEn => {
                     if(subEn!==en && Math.hypot(subEn.x-en.x, subEn.y-en.y) < 150) {
                          subEn.hp -= finalDmg/2; subEn.flash=3; 
                          floatTexts.push(new FloatText(subEn.x+subEn.w/2,subEn.y,Math.floor(finalDmg/2),'#0af'));
                          ctx.strokeStyle='#0ff'; ctx.beginPath(); ctx.moveTo(en.x+en.w/2,en.y+en.h/2); ctx.lineTo(subEn.x+subEn.w/2,subEn.y+subEn.h/2); ctx.stroke();
                     }
                });
            }
            if(p.hasRelic('vamp') && p.hp < p.maxHp && Math.random() < 0.2) { p.hp = Math.min(p.hp+2, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "+2", "#0f0")); }
            if(s.lifesteal && p.hp < p.maxHp) { p.hp = Math.min(p.hp+5, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "+5", "#a0a")); }
            if(p.hasEnchant('vampire') && Math.random() < 0.1) { p.hp = Math.min(p.hp+5, p.maxHp); floatTexts.push(new FloatText(p.x, p.y, "VAMPIRO", "#f00")); }
            if(en.hp<=0 && !en.dead){
                en.dead=true;
                if(en.type === 'BOSS') openEnchantMenu(p);
                checkMission('kill_melee');
                if(en.type === 'SHOOTER') checkMission('kill_shooter');
                if(en.elite) checkMission('kill_elite');
                if(gameMode === 'MADMAN' && Math.random() < 0.3) { 
                    let lootKeys = ['SWORD', 'REVOLVER', 'BOW', 'AXE'];
                    let k = lootKeys[Math.floor(Math.random()*lootKeys.length)];
                    if(p.inventory.length < 5 && !p.inventory.includes(k)) {
                        p.inventory.push(k); p.weaponLevels[k]=1;
                        floatTexts.push(new FloatText(p.x, p.y-20, "ARMA ENCONTRADA", "#0f0"));
                        updateInventoryUI();
                    }
                }
                gold+=15;playSfx('coin');spawnParticles(en.x+en.w/2,en.y+en.h/2,en.color,30,5,3);for(let k=0;k<3;k++)decals.push(new Decal(en.x+Math.random()*20-10,en.y+Math.random()*20-10,Math.random()>0.5?en.color:'#511',5+Math.random()*10));
            }
        }});
    }else{
        let count = s.count || 1;
        if(p.hasEnchant('multishot') && Math.random() < 0.2) count++;
        for(let i=0; i<count; i++){
            let ang = p.angle;
            if(count > 1) ang += (Math.random()-0.5) * (s.spread || 0.2);
            projectiles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:Math.cos(ang)*10,vy:Math.sin(ang)*10,dmg:finalDmg,explosive:s.explosive,pierce:s.pierce, lightning:s.lightning, lifesteal:s.lifesteal, isCrit:isCrit, owner: p});
        }
        spawnParticles(p.x+p.w/2+Math.cos(p.angle)*20,p.y+p.h/2+Math.sin(p.angle)*20,s.color,10,3,2);
    }
}

function draw(){
    ctx.save();if(screenShake>0){ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);}
    ctx.fillStyle=currentBiome.bg;ctx.fillRect(0,0,1000,700);ctx.fillStyle=currentBiome.floor;for(let i=0;i<1000;i+=40)for(let j=0;j<700;j+=40)if((i+j)%80===0)ctx.fillRect(i,j,40,40);
    decals.forEach(d=>d.draw(ctx));
    traps.forEach(tr=>tr.draw(ctx));
    warnings.forEach(w=>{ctx.fillStyle=`rgba(255,0,0,${0.2+(w.life%10)/50})`;ctx.beginPath();ctx.arc(w.x+30,w.y+30,w.r,0,6.28);ctx.fill();ctx.strokeStyle='#f00';ctx.lineWidth=2;ctx.stroke();});
    structures.forEach(st=>{ctx.fillStyle=currentBiome.wall;ctx.fillRect(st.x,st.y,st.w,st.h);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(st.x,st.y,st.w,st.h);});
    particles.forEach(p=>p.draw(ctx));
    
    enemies.forEach(en=>{
        ctx.save();ctx.translate(en.x+en.w/2,en.y+en.h/2);ctx.translate(0,Math.sin(en.walkCycle)*2);
        if(en.type === 'BOSS') {
            ctx.fillStyle = en.flash>0?'#fff':en.color;
            if(en.bossSubType === 'SKELETON') {
                ctx.fillRect(-25,-35,50,50); ctx.fillStyle = '#000'; ctx.fillRect(-15,-25,10,10); ctx.fillRect(5,-25,10,10); ctx.fillRect(-5,-5,10,15);
            } else if (en.bossSubType === 'GOLEM') {
                ctx.fillRect(-30,-30,60,60); ctx.fillStyle = '#422'; ctx.fillRect(-40,-10,10,40); ctx.fillRect(30,-10,10,40); ctx.fillStyle = '#0f0'; ctx.fillRect(-5,-5,10,10);
            } else if (en.bossSubType === 'DEMON') {
                ctx.fillRect(-25,-30,50,60); ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.moveTo(-20,-30); ctx.lineTo(-30,-50); ctx.lineTo(-10,-30); ctx.fill(); ctx.beginPath(); ctx.moveTo(20,-30); ctx.lineTo(30,-50); ctx.lineTo(10,-30); ctx.fill();
            }
            ctx.strokeStyle='#ff0';ctx.lineWidth=3;ctx.strokeRect(-en.w/2,-en.h/2,en.w,en.h);
        } else {
            ctx.fillStyle=en.flash>0?'#fff':en.color; ctx.fillRect(-en.w/2,-en.h/2,en.w,en.h);
            if(en.elite){ctx.strokeStyle='#fe0';ctx.lineWidth=2;ctx.strokeRect(-en.w/2,-en.h/2,en.w,en.h);}
        }
        ctx.fillStyle='#f00';ctx.fillRect(-en.w/2,-en.h/2-6,en.w,4);ctx.fillStyle='#0f0';ctx.fillRect(-en.w/2,-en.h/2-6,en.w*(en.hp/en.maxHp),4);
        ctx.restore();
    });

    projectiles.forEach(b=>{ctx.fillStyle=b.explosive?'#f80':(b.pierce?'#0ff':(b.isCrit?'#f80':'#ff0'));ctx.fillRect(b.x-2,b.y-2,b.explosive?6:4,b.explosive?6:4);});
    enemyBullets.forEach(b=>{ctx.fillStyle=b.reflected?'#0ff':'#f0f';ctx.fillRect(b.x-b.size/2,b.y-b.size/2,b.size,b.size);});
    
    [p1,p2].forEach(p=>{if(!p.alive)return;ctx.save();ctx.translate(Math.floor(p.x+p.w/2),Math.floor(p.y+p.h/2));
        let s=getWeaponStats(p); if(p.atkTimer>0&&!s.maxAmmo&&!p.comboTimer){ctx.fillStyle='#000';ctx.fillRect(-12,12,24,4);ctx.fillStyle='#ff0';ctx.fillRect(-11,13,22*(1-p.atkTimer/s.cd),2);}
        if(p.dashCd>0){ctx.fillStyle='#000';ctx.fillRect(-12,17,24,2);ctx.fillStyle='#0ff';ctx.fillRect(-12,17,24*(1-p.dashCd/300),2);}
        if(p.isReflecting){ctx.strokeStyle='#4af';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,25,0,6.28);ctx.stroke();ctx.fillStyle='rgba(100,200,255,0.2)';ctx.fill();}
        ctx.translate(0,Math.sin(p.walkCycle)*2);ctx.rotate(p.angle);ctx.fillStyle=p.dashTimer>0?'#fff':p.skin.body;ctx.fillRect(-10,-10,20,20);ctx.fillStyle='#000';ctx.strokeRect(-10,-10,20,20);ctx.fillStyle=p.skin.detail;ctx.fillRect(0,-6,8,4);
        
        let ia=p.animTimer>0,ap=1-(p.animTimer/p.animMax),n=s.name;
        ctx.save();if(s.type==='ranged'&&ia){let k=Math.sin(ap*Math.PI)*6;ctx.translate(-k,0);ctx.rotate(-k/10);}
        let rev = (s.type==='melee' && p.lastAttackReverse);
        if(n==="ESPADA")dSW(ctx,dP_Sw,ap,rev);else if(n==="HACHA")dSW(ctx,dP_Ax,ap,rev);else if(n==="LANZA")dST(ctx,dP_Sp,ap);else if(n==="KATANA")dSW(ctx,dP_Ka,ap,1);else if(n==="ESCUDO")dP_Sh(ctx,0,0,0,p.skin.body);else if(n==="ARCO")dP_Bo(ctx,0,0,0,p.animTimer);else if(n==="REVOLVER")dP_Rv(ctx,0,0,0,p.animTimer);else if(n==="VARA FUEGO")dP_St(ctx,0,0,0,ia);else if(n==="BALLESTA")dP_Cr(ctx,0,0,0,ia);else if(n==="ESCOPETA")dP_Sg(ctx,0,0,0,ia);
        else if(n==="MJOLNIR")dSW(ctx,dP_Mj,ap,rev); else if(n==="GUADAÑA V.")dSW(ctx,dP_Sc,ap,rev); else if(n==="LAZ-R")dP_La(ctx,0,0,0,ia); else if(n==="CAÑON ORO")dP_Gc(ctx,0,0,0,ia);
        ctx.restore();

        if(s.maxAmmo&&p.reloadTimer>0){ctx.rotate(-p.angle);ctx.fillStyle="#ff0";ctx.font="8px 'Press Start 2P'";ctx.fillText("RELOAD",-20,-20);}
        if(p.hasRelic('dodge')){ctx.fillStyle = p.dodgeCharges>0 ? '#0af' : '#666'; ctx.font="8px 'Press Start 2P'";ctx.fillText(p.dodgeCharges>0 ? `(${p.dodgeCharges})` : "(Recarga)", -15, -25);}
        ctx.restore();});
    floatTexts.forEach(f=>f.draw(ctx));
    ctx.restore();
}

function dSW(c,d,p,r=false){if(p>=1||p<=0){d(c,0,0,0,false);return;}let a=Math.sin(Math.pow(p,0.7)*Math.PI)*(r?2.5:-2.5),l=Math.sin(p*Math.PI)*8;c.translate(l,0);c.rotate(a);d(c,0,0,0,true);}
function dST(c,d,p){if(p>=1||p<=0){d(c,0,0,0,false);return;}let s=Math.sin(Math.pow(p,0.5)*Math.PI)*25;c.translate(s,0);d(c,0,0,0,true);}
function dP_Sw(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-0.78);let k=2,p=[[0,0,1,0,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[0,1,2,1,0],[0,1,3,1,0],[1,1,4,1,1],[1,4,4,4,1],[0,1,5,1,0],[0,1,5,1,0],[0,1,4,1,0]];dM(c,p,k,-2,-10);c.restore();}
function dP_Ax(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-1.04);let k=2,p=[[0,0,1,1,1,0],[0,1,2,2,3,1],[1,2,2,2,3,1],[1,2,2,2,3,1],[1,2,2,2,3,1],[0,1,5,3,1,0],[0,0,5,1,0,0],[0,0,5,0,0,0],[0,0,5,0,0,0],[0,0,5,0,0,0],[0,0,1,0,0,0]];dM(c,p,k,-3,-8);c.restore();}
function dP_Sp(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,1,0],[1,2,1],[1,2,1],[1,2,1],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0]];dM(c,p,k,-1,-14);c.restore();}
function dP_Sh(c,x,y,a,col){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,1,1,1,0],[1,2,2,2,1],[1,2,2,2,1],[1,2,2,2,1],[1,2,2,2,1],[0,1,2,1,0],[0,0,1,0,0]];dM(c,p,k,-2,-3,col);c.restore();}
function dP_Bo(c,x,y,a,t){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,0,1,0,0],[0,1,5,1,0],[1,5,0,5,1],[1,5,0,5,1],[1,5,0,5,1],[0,1,5,1,0],[0,0,1,0,0]];dM(c,p,k,-2,-3,'#631');c.strokeStyle='#eee';c.lineWidth=1;c.beginPath();let pu=t>0?Math.min(6,t/5):0;c.moveTo(-2*k,-3*k);c.lineTo(0,0+pu);c.lineTo(-2*k,4*k);c.stroke();c.restore();}
function dP_Rv(c,x,y,a,t){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,r=t>20?-3:0,p=[[0,1,1,0],[0,2,2,0],[0,1,1,0],[1,2,2,1],[1,1,1,1],[0,3,3,0],[0,3,3,0]];dM(c,p,k,-2,-4+r);c.restore();}
function dP_Ka(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(1.04);let k=2,p=[[0,0,1,0],[0,1,3,1],[0,1,2,1],[0,1,2,1],[0,1,2,1],[0,1,2,1],[0,1,2,1],[0,1,2,1],[1,4,4,1],[0,5,5,0],[0,5,5,0]];dM(c,p,k,-2,-8);c.restore();}
function dP_St(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,4,0],[4,2,4],[0,4,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0],[0,5,0]];dM(c,p,k,-1,-6,'#f00');c.restore();}
function dP_Cr(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);let k=2,p=[[0,1,5,1,0],[1,0,5,0,1],[1,0,5,0,1],[0,1,5,1,0],[0,0,5,0,0]];dM(c,p,k,-2,-3);c.restore();}
function dP_Sg(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,1,1,0],[1,2,2,1],[1,2,2,1],[1,2,2,1],[0,5,5,0],[0,5,5,0],[0,5,5,0]];dM(c,p,k,-2,-3,'#666');c.restore();}
function dP_Mj(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-0.7);let k=2,p=[[0,2,2,2,0],[2,3,3,3,2],[2,3,4,3,2],[2,3,3,3,2],[0,2,2,2,0],[0,0,5,0,0],[0,0,5,0,0],[0,0,5,0,0]];dM(c,p,k,-2,-6,'#88a');c.restore();}
function dP_Sc(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(20,0);c.rotate(1.57);if(!s)c.rotate(-1.0);let k=2,p=[[0,0,0,0,2],[0,0,0,2,0],[0,0,2,0,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0]];dM(c,p,k,-2,-6,'#d0d');c.restore();}
function dP_La(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,2,0],[0,2,0],[1,2,1],[1,2,1],[0,1,0]];dM(c,p,k,-1,-3,'#0ff');c.restore();}
function dP_Gc(c,x,y,a,s){c.save();c.translate(x,y);c.rotate(a);c.translate(15,0);c.rotate(1.57);let k=2,p=[[0,4,4,0],[4,4,4,4],[4,4,4,4],[0,1,1,0]];dM(c,p,k,-2,-3,'#fd0');c.restore();}
function dM(c,p,s,ox,oy,sc){for(let r=0;r<p.length;r++)for(let k=0;k<p[r].length;k++){let v=p[r][k];if(v!==0){if(v===1)c.fillStyle='#222';if(v===2)c.fillStyle=sc||'#eee';if(v===3)c.fillStyle='#ccc';if(v===4)c.fillStyle='#fc0';if(v===5)c.fillStyle='#631';c.fillRect((k+ox)*s,(r+oy)*s,s,s);}}}

function refreshShop() { if(gold>=50){gold-=50; openShop(); updateShopUI(); playSfx('coin');} }
function openShop() { 
    state='SHOP'; document.getElementById('shop-menu').style.display='flex'; document.getElementById('shop-gold').innerText=gold;
    const cw = document.getElementById('shop-weapons-rng'); cw.innerHTML='';
    const cr = document.getElementById('shop-relics-rng'); cr.innerHTML='';
    const cc = document.getElementById('shop-consumables'); cc.innerHTML='';
    const cs = document.getElementById('shop-sell'); cs.innerHTML='';

    let wKeys = Object.keys(WEAPONS).filter(k => !WEAPONS[k].unique && k!=='FIST');
    let randWeapons = [];
    for(let i=0; i<3; i++) { let key = wKeys[Math.floor(Math.random()*wKeys.length)]; randWeapons.push(WEAPONS[key]); }
    randWeapons.forEach(w => {
        let d=document.createElement('div'); d.className='shop-item';
        let owned=p1.inventory.includes(getWeaponKeyName(w.id));
        let lvl=p1.weaponLevels[getWeaponKeyName(w.id)]||1;
        let price = owned ? 50*lvl : w.cost;
        if(w.legendary) d.classList.add('legendary-item');
        d.innerHTML = owned ? `<span>MEJORAR ${w.name}</span><span style="font-size:8px">LVL ${lvl}->${lvl+1}</span><span style="color:#fe0">$${price}</span>` : `<span>${w.name}</span><span style="color:#fe0">$${price}</span>`;
        d.onclick = () => {
            if(gold>=price){
                if(!owned && p1.inventory.length >= 5 && gameMode!=='SANDBOX') { alert("INVENTARIO LLENO (5/5)"); return; }
                gold-=price;playSfx('coin'); 
                [p1, (isCoop?p2:null)].forEach(p=>{
                    if(p) {
                        if(w.name === "ESCUDO") { p.hasShield = true; p.inventory.push('SHIELD'); }
                        else if(owned){p.weaponLevels[getWeaponKeyName(w.id)]++;}
                        else{p.inventory.push(getWeaponKeyName(w.id));p.weaponLevels[getWeaponKeyName(w.id)]=1;}
                    }
                });
                d.classList.add('purchased'); updateShopUI(); updateInventoryUI();
                openShop(); 
            }
        };
        cw.appendChild(d);
    });

    let availableRelics = RELICS.filter(r => !p1.hasRelic(r.id));
    if(availableRelics.length > 0) {
        let randRelics = [];
        for(let i=0; i<3; i++) {
            if(availableRelics.length===0) break;
            let idx = Math.floor(Math.random()*availableRelics.length); randRelics.push(availableRelics[idx]); availableRelics.splice(idx,1);
        }
        randRelics.forEach(r => {
            let d=document.createElement('div'); d.className='shop-item relic-card';
            d.innerHTML = `<span>${r.name}</span><div class="relic-desc">${r.desc}</div><span style="color:#fe0">$${r.cost}</span>`;
            d.onclick = () => { if(gold>=r.cost){gold-=r.cost;playSfx('coin');
                [p1, (isCoop?p2:null)].forEach(p=>{ if(p) p.relics.push(r.id); });
                d.classList.add('purchased'); updateShopUI(); updateRelicUI();} 
            };
            cr.appendChild(d);
        });
    } else { cr.innerHTML = '<div style="font-size:10px; color:#888; text-align:center; padding:10px;">AGOTADAS</div>'; }

    let cons = [{k:'HP',l:'POCIÓN VIDA',c:30}, {k:'ARMOR',l:'ARMADURA',c:50}];
    cons.forEach(it=>{
        let d=document.createElement('div'); d.className='shop-item';
        d.innerHTML = `<span>${it.l}</span><span style="color:#fe0">$${it.c}</span>`;
        d.onclick = () => { if(gold>=it.c){gold-=it.c;playSfx('coin');
            [p1, (isCoop?p2:null)].forEach(p=>{
                if(p && p.alive) { if(it.k==='ARMOR')p.armor=50; else p.hp=100; }
            });
            updateShopUI();} 
        };
        cc.appendChild(d);
    });

    p1.inventory.forEach(invKey => {
        let w = WEAPONS[invKey];
        if(w.name === 'PUÑOS') return; 
        let isEquipped = (w.name === p1.weapon.name) || (isCoop && p2.weapon.name === w.name);
        
        let sellPrice = Math.floor(w.cost / 2) || 50; // New Sell logic

        let d=document.createElement('div'); 
        d.className='shop-item sell-mode';
        if(isEquipped) d.classList.add('cant-sell');
        
        d.innerHTML = `<span>${w.name}</span><span style="color:#f44; font-size:8px;">${isEquipped ? "EQUIPADA" : "VENDER +$"+sellPrice}</span>`;
        d.onclick = () => {
            if(isEquipped) return;
            gold += sellPrice; playSfx('coin');
            [p1, (isCoop?p2:null)].forEach(p=>{
                if(p) {
                    p.inventory = p.inventory.filter(k => k !== invKey);
                    if(w.name === 'ESCUDO') p.hasShield = false;
                }
            });
            openShop();
            updateInventoryUI();
        };
        cs.appendChild(d);
    });
}
function getWeaponKeyName(id) { for(let k in WEAPONS) if(WEAPONS[k].id===id)return k; return 'SWORD'; }
function updateShopUI() { document.getElementById('shop-gold').innerText=gold; }
function updateRelicUI() {
    let el = document.getElementById('relics-list'); el.innerHTML='';
    p1.relics.forEach(rid => {
        let r = RELICS.find(x=>x.id===rid);
        let d = document.createElement('div');
        d.style.width='8px'; d.style.height='8px'; d.style.background='#0af'; d.style.border='1px solid #fff'; d.title=r.name;
        d.style.marginBottom='2px';
        el.appendChild(d);
    });
}
function updateInventoryUI() {
    const el = document.getElementById('inventory-hud'); el.innerHTML = '';
    p1.inventory.forEach((key, idx) => {
        let w = WEAPONS[key];
        let d = document.createElement('div');
        d.className = 'inv-slot' + (p1.weapon.name === w.name ? ' active' : '');
        
        let enchInd = '';
        if(p1.weaponEnchants[w.name] && p1.weaponEnchants[w.name].length > 0) {
            enchInd = '<div class="ench-indicator" style="display:block"></div>';
        }

        d.innerHTML = `<span class="inv-key">${idx+1}</span>${w.name.substring(0,3)}${enchInd}`;
        d.title = w.name;
        // CLICK TO EQUIP HANDLER
        d.onclick = () => { 
            switchWeapon(p1, idx+1); 
            if(isCoop) switchWeapon(p2, idx+1); 
        };
        el.appendChild(d);
    });
}
function nextWave() { wave++; state='PLAYING'; document.getElementById('shop-menu').style.display='none'; spawnLevel(); }
function loop() { update(); draw(); requestAnimationFrame(loop); }
// SAVE SYSTEM HOOK
window.onload = () => { if(localStorage.getItem('pd_save_data')) document.getElementById('btn-continue').style.display='inline-block'; updatePreview(1); updatePreview(2); updateClassUI(1); updateClassUI(2); };
window.onkeydown=e=>{if(bindingAction){let k=e.key.toLowerCase();KEYBINDS[bindingAction]=k;bindingAction=null;saveKeys();renderControls();return;}if(e.key==='Escape')togglePause();keys[e.key.toLowerCase()]=true;}
window.onkeyup=e=>{if(!bindingAction)keys[e.key.toLowerCase()]=false;}
// --- DETECCIÓN Y CONTROLES MÓVILES ---
function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 800;
    
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'flex';
        // Ajustar controles táctiles
        setupTouchBtn('m-up', 'w');
        setupTouchBtn('m-down', 's');
        setupTouchBtn('m-left', 'a');
        setupTouchBtn('m-right', 'd');
        setupTouchBtn('m-atk', 'e');
        setupTouchBtn('m-dash', ' ');
        setupTouchBtn('m-shield', 'r');
        
        // Mensaje de bienvenida móvil
        setTimeout(() => alert("MODO MÓVIL DETECTADO\nUsa los controles en pantalla."), 500);
    }
}

function setupTouchBtn(id, keyKey) {
    const btn = document.getElementById(id);
    if(!btn) return;
    
    // Al tocar
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Evitar scroll
        keys[keyKey] = true;
        btn.style.background = "rgba(255,255,255,0.5)";
    }, {passive: false});

    // Al soltar
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[keyKey] = false;
        btn.style.background = ""; // Restaurar color
    }, {passive: false});
}

// Ejecutar detección al inicio
detectMobile();