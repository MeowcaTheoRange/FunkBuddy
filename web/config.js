var fs = require("fs");
var json;
var nameGetter = /(.*?)(?=[0-9]+$)/gm;
var parser = new DOMParser();
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

ipcRenderer.on('configPath', function (evt, path) {
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
  ipcRenderer.invoke('writeConfig', JSON.stringify(json, null, 2));
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