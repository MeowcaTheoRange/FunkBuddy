var fs = require("fs");
var json;
var nameGetter = /(.*?)(?=[0-9]+$)/gm;
var parser = new DOMParser();
var jsonbinds;
var xmllist;
var dirpath;
const { ipcRenderer } = require('electron');
const pathjs = require('path');

function loadForm(path) {
  json = JSON.parse(fs.readFileSync(pathjs.join(path, "config.json")));
  console.log(json);
  
  seeValidBinds(pathjs.join(path, "char.xml"));
  ipcRenderer.invoke('resizeToSprite', 600, 400);
  document.querySelector("input#idle").value = json.binds.idle;
  document.querySelector("input#zoom").value = json.charZoom;
  document.querySelector("input#opacity").value = json.opacity;
  document.querySelector("input#fps").value = json.fps;
  document.querySelector("div#presets").innerHTML = getPresets(path);
  document.querySelector("div#xmlPres").innerHTML = getImages(path);
  if (json.align) {
    document.querySelector("#alignRadioLeft").checked = isTrue(json.align[0]);
    document.querySelector("#alignRadioRight").checked = isTrue(json.align[1]);
    document.querySelector("#alignRadioUp").checked = isTrue(json.align[2]);
    document.querySelector("#alignRadioDown").checked = isTrue(json.align[3]);
  }
  var binds = json.binds;
  binds.idle = undefined;
  document.querySelector("textarea#binds").value = JSON.stringify(json.binds, null, 2);
}

function getImages(path) {
  xmllist = fs.readdirSync(pathjs.join(path, "xmls")).filter((v) => {
    return v.endsWith(".xml");
  });
  return reloadImages();
}

function reloadImages() {
  var html = [];
  Object.entries(xmllist).forEach((xml) => {
    console.log(xml);
    html.push(`<div class="bind"><span>${xml[1]}</span><br /><button onclick='loadImage("${xml[1]}")'>^</button></div>`);
  });
  return html.join("\n");
}

function loadImage(xmlName) {
  var xmlTemp = fs.readFileSync(pathjs.join(dirpath, "xmls", xmlName), {encoding: "utf-8"});
	var pngName = parser.parseFromString(xmlTemp.replace(/[^ \S]/gm, ""), "text/xml").getElementsByTagName("TextureAtlas")[0].getAttribute("imagePath");
  document.querySelector("input#xmlPath").value = pathjs.join(dirpath, "xmls", xmlName);
  document.querySelector("input#filePath").value = pathjs.join(dirpath, "xmls", pngName);
}

function addImage() {
  var filepath = document.querySelector("input#filePath").value;
  var xmlpath = document.querySelector("input#xmlPath").value
  fs.copyFile(filepath, pathjs.join(dirpath, "xmls", pathjs.basename(filepath)), (err) => {
    if (err) console.log("File error, stat " + fileval);
  });
  fs.copyFile(xmlpath, pathjs.join(dirpath, "xmls", pathjs.basename(xmlpath)), (err) => {
    if (err) console.log("File error, stat " + fileval);
  });
  getImages(dirpath);
}

function getPresets(path) {
  jsonbinds = JSON.parse(fs.readFileSync(pathjs.join(path, "presets.json")));
  return reloadPresets();
}

function reloadPresets() {
  var html = [];
  Object.entries(jsonbinds).forEach((binds) => {
    html.push(`<div class="bind"><span>${binds[1].name}</span><br /><button onclick='loadPreset("${binds[0]}")'>^</button><button onclick='removePreset("${binds[0]}")'>X</button></div>`);
  });
  console.log(html);
  return html.join("\n");
}

function loadPreset(bind) {
  document.querySelector("textarea#binds").value = JSON.stringify(jsonbinds[bind].binds, null, 2);
  document.querySelector("input#idle").value = jsonbinds[bind].idle;
  document.querySelector("input#fps").value = jsonbinds[bind].fps;
  document.querySelector("input#zoom").value = jsonbinds[bind].zoom;
  document.querySelector("#presetname").value = bind;
}

function addPreset(name) {
  var theName = document.querySelector(name);
  var id = theName.value.replace(/[\W\d]/gm, "").toLowerCase();
  jsonbinds[id] = {
    name: theName.value,
    binds: JSON.parse(document.querySelector("textarea#binds").value),
    idle: document.querySelector("input#idle").value,
    fps: document.querySelector("input#fps").value,
    zoom: document.querySelector("input#zoom").value
  };
  theName.value = "";
  document.querySelector("div#presets").innerHTML = reloadPresets();
}

function removePreset(bind) {
  delete jsonbinds[bind];
  document.querySelector("div#presets").innerHTML = reloadPresets();
}

ipcRenderer.on('configPath', function (evt, path) {
  dirpath = path;
  loadForm(path);
});

function saveForm() {
  var fileval = document.querySelector("input#filePath").value;
  var xmlval = document.querySelector("input#xmlPath").value;
  var binds;
  try {
    binds = JSON.parse(document.querySelector("textarea#binds").value);
    binds.idle = document.querySelector("input#idle").value;
  } catch (e) {
    alert("JSON is not valid!");
    return false;
  }
  var json = {
    "binds": binds,
    "charZoom": document.querySelector("input#zoom").value,
    "opacity": document.querySelector("input#opacity").value,
    "fps": document.querySelector("input#fps").value,
    "align": [
      isInitial(document.querySelector("#alignRadioLeft").checked),
      isInitial(document.querySelector("#alignRadioRight").checked),
      isInitial(document.querySelector("#alignRadioUp").checked),
      isInitial(document.querySelector("#alignRadioDown").checked)
    ]
  }
  console.log(json);
  if (fileval)
    ipcRenderer.invoke('copyFiles', fileval, xmlval);
  ipcRenderer.invoke('writeConfig', JSON.stringify(json, null, 2), JSON.stringify(jsonbinds, null, 2));
  return true;
}

ipcRenderer.on('configGotImage', function (evt, res) {
	document.querySelector("input#filePath").value = res.filePaths[0];
});

ipcRenderer.on('configGotXml', function (evt, res) {
	document.querySelector("input#xmlPath").value = res.filePaths[0];
  seeValidBinds(res.filePaths[0]);
});

function seeValidBinds(path) {
  var valid = document.querySelector("#validAnims");
  var rfs = fs.readFileSync(path, {encoding: "utf-8"});
	var xmlDoc = parser.parseFromString(rfs.replace(/[^ \S]/gm, ""), "text/xml");
	var indices = xmlDoc.getElementsByTagName("SubTexture");
  console.log(indices);
  var validObj = {};
	Array.from(indices).forEach((subTexture) => {
    var name = subTexture.getAttribute("name").match(nameGetter).join("");
    validObj[name] = `<li>${name}</li>`;
	});
  valid.innerHTML = Object.values(validObj).join("");
}

function isInitial(x) {
  return x ? "0" : "initial";
}

function isTrue(x) {
  return x != "initial";
}