const { ipcRenderer, session } = require('electron');
const pathjs = require('path');

var guide = [
	null,
  'Escape',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '0',
  'Minus',
  'Equal',
  'Backspace',
  'Tab',
  'Q',
  'W',
  'E',
  'R',
  'T',
  'Y',
  'U',
  'I',
  'O',
  'P',
  'BracketLeft',
  'BracketRight',
  'Enter',
  'Ctrl',
  'A',
  'S',
  'D',
  'F',
  'G',
  'H',
  'J',
  'K',
  'L',
  'Semicolon',
  'Quote',
  'Backquote',
  'Shift',
  'Backslash',
  'Z',
  'X',
  'C',
  'V',
  'B',
  'N',
  'M',
  'Comma',
  'Period',
  'Slash',
  'ShiftRight',
  'NumpadMultiply',
  'Alt',
  'Space',
  'CapsLock',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'NumLock',
  'ScrollLock',
  'Numpad7',
  'Numpad8',
  'Numpad9',
  'NumpadSubtract',
  'Numpad4',
  'Numpad5',
  'Numpad6',
  'NumpadAdd',
  'Numpad1',
  'Numpad2',
  'Numpad3',
  'Numpad0',
  'NumpadDecimal',
  'F11',
  'F12'
];
guide[57419] = "ArrowLeft";
guide[57424] = "ArrowDown";
guide[57416] = "ArrowUp";
guide[57421] = "ArrowRight";

var fs = require("fs");
const { exec } = require("child_process");
var json;

var parser = new DOMParser();
var nameGetter = /(.*?)(?=[0-9]+$)/gm;
var intGetter = /(?<=.*?)([0-9]+)$/gm;
var char = document.getElementById("char");
var shell = document.getElementById("shell");
var xmlDoc;
var indices;
var allAnims;
var anim;
var biggestHeight = 0;
var biggestWidth = 0;
var jsonRaw;
async function onLoad(path) {
	json = JSON.parse(jsonRaw);
  console.log(json);
	document.body.style.zoom = json.charZoom;
	char.style.opacity = json.opacity;
	document.querySelector(':root').style.setProperty('--charzoom', 1 / json.charZoom);
	var json_keys = Object.values(json.binds);
	cancelAnimationFrame(ireq);
  	var rfs = fs.readFileSync(pathjs.join(path, "char.xml"), {encoding: "utf-8"});
	xmlDoc = parser.parseFromString(rfs.replace(/[^ \S]/gm, ""), "text/xml");
	indices = xmlDoc.getElementsByTagName("SubTexture");
	allAnims = {};
  console.log(xmlDoc);
	Array.from(indices).forEach((subTexture) => {
		var name = subTexture.getAttribute("name").match(nameGetter).join("");
		var int = parseInt(subTexture.getAttribute("name").match(intGetter).join(""));
		if (json_keys.includes(name) && subTexture.getAttribute("width") > biggestWidth)
			biggestWidth = subTexture.getAttribute("width");
		if (json_keys.includes(name) && subTexture.getAttribute("height") > biggestHeight)
			biggestHeight = subTexture.getAttribute("height");
		if (json_keys.includes(name) && subTexture.getAttribute("frameWidth") > biggestWidth)
			biggestWidth = subTexture.getAttribute("frameWidth");
		if (json_keys.includes(name) && subTexture.getAttribute("frameHeight") > biggestHeight)
			biggestHeight = subTexture.getAttribute("frameHeight");

		if (allAnims[name] == null)
			allAnims[name] = [];

		allAnims[name][int] = {
			int: int,
			x: subTexture.getAttribute("x"),
			y: subTexture.getAttribute("y"),
			w: subTexture.getAttribute("width"),
			h: subTexture.getAttribute("height"),
			ox: subTexture.getAttribute("frameX"),
			oy: subTexture.getAttribute("frameY"),
			ow: subTexture.getAttribute("frameWidth"),
			oh: subTexture.getAttribute("frameHeight")
		};
	});
	ipcRenderer.invoke("resizeToSprite", Math.floor(biggestWidth / (1 / json.charZoom)), Math.floor(biggestHeight / (1 / json.charZoom)));
  console.log(allAnims);
	anim = allAnims[json.binds["idle"]];
	ireq = requestAnimationFrame(doanimate);
	char.src = pathjs.join(path, "char.png");
  if (json.align) {
    shell.style.left = json.align[0];
    shell.style.right = json.align[1];
    shell.style.top = json.align[2];
    shell.style.bottom = json.align[3];
  }
  addToQueue(json.binds["idle"], 0);
}

let timeWhenLastUpdate;
let timeFromLastUpdate;
var curAnim = "idle";
var fn = 0;
var dur = 0;
var animQueue = {};
var sortedArray = [];

function addToQueue(anim, ts) {
  if (anim == undefined) return;
  if (animQueue[anim] != undefined && animQueue[anim][2]) return;
  var item = anim;
  if (Array.isArray(anim)) item = anim[Math.floor(Math.random()*anim.length)];
  animQueue[anim] = [ts, anim, true];
  updateQueue();
}
function removeFromQueue(anim) {
  if (anim == undefined) return;
  delete animQueue[anim];
  updateQueue();
}

function updateQueue() {
  sortedArray = Object.values(animQueue);
  sortedArray.sort((a, b) => b[0] - a[0]);
  sortedArray = sortedArray.filter((v) => v[2]);
  animateImage(sortedArray[0][1]);
}

function animateImage(animation) {
	curAnim = animation;
	anim = allAnims[animation];
	timeWhenLastUpdate = null;
	timeFromLastUpdate = null;
	fn = 0;
	dur = 0;
	cancelAnimationFrame(ireq);
	theThing();
	ireq = requestAnimationFrame(doanimate);
}

let ireq = 0;

function doanimate(st) {
	if (!timeWhenLastUpdate) timeWhenLastUpdate = st;

	timeFromLastUpdate = st - timeWhenLastUpdate;
	if (timeFromLastUpdate >= (1000 / json.fps)) {
		timeWhenLastUpdate = st;
		theThing();
	}

	ireq = requestAnimationFrame(doanimate);
}

function theThing() {
	char.style.objectPosition = `-${anim[fn].x}px -${anim[fn].y}px`;
	char.style.width = `${anim[fn].w}px`;
	char.style.height = `${anim[fn].h}px`;
	shell.style.width = `${anim[fn].ow ?? anim[fn].w}px`;
	shell.style.height = `${anim[fn].oh ?? anim[fn].h}px`;
	char.style.left = `${(anim[fn].ox ?? 0) * -1}px`;
	char.style.top = `${(anim[fn].oy ?? 0) * -1}px`;
	fn++;
  dur++;
	if (fn >= anim.length) fn = 0;
	if (dur >= allAnims[json.binds["idle"]].length) {
		dur = 0;
    if (curAnim != json.binds["idle"] && !animQueue[curAnim][2]) removeFromQueue(curAnim);
	}
}

ipcRenderer.on('configPath', function (evt, path) {
  fs.readFile(pathjs.join(path, "config.json"), {encoding: 'utf-8'}, (err, data) => {
    if (err) location.reload();
    jsonRaw = data;
    onLoad(path);
  });
});

ipcRenderer.on('keydown', function (evt, key) {
	addToQueue(json.binds[guide[key.keycode]], key.time);
});

ipcRenderer.on('keyup', function (evt, key) {
  if (animQueue[json.binds[guide[key.keycode]]]) animQueue[json.binds[guide[key.keycode]]][2] = false;
  if (dur <= 0) removeFromQueue(json.binds[guide[key.keycode]]);
});

window.onerror = function(error) {
  // alert(error);
  ipcRenderer.invoke('navApp', 'web/config.html');
};
