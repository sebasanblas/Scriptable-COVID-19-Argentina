// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: syringe;

/**************
Version 1.0.0

Changelog:
  v1.0.0:
            - Posibilidad de seleccionar provincia vía "Parameter" en la App Scriptable (Widget).
            - Colores de gráficos y números en función del % de vacunas aplicadas

Creditos: 
  - Idea original: marco79cgn@Github (https://gist.github.com/marco79cgn/b5f291d6242a2c530e56c748f1ae7f2c)
  - Modificado para Argentina: sebasanblas@Github (https://github.com/sebasanblas)
  - Datos provenientes de: fom78@Github (https://covid-vacuna-ar.vercel.app)
**************/

////////////////////////////////////////////////////////////////////////////////
//////////////////////////         User-Config         /////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Escribir la provincia según corresponda vía parametro en la configuración del Widget, de Scriptable.

// El porcentaje de las vacunas colocadas son de la primera dosis tanto a nivel nacional como provincial.

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


const defaultprovincia = "Mendoza"

if (!args.widgetParameter) {
  arg_provincia = defaultprovincia
} else {
  arg_provincia = args.widgetParameter
}

const cacheMinutes = 60;
const today = new Date();
let result;
let result_prov;
let resultAr;
let resultProv;
let width = 100;
const h = 5;

let widget = new ListWidget();
widget.setPadding(8, 10, 0, 10);
widget.url =
  "https://covid-vacuna-ar.vercel.app/";

await getNumbers();
await getNumbers_prov();
await createWidget();
Script.setWidget(widget);
Script.complete();

if (config.runsInApp) {
    widget.presentSmall();
  }

async function createWidget() {

  const upperStack = widget.addStack();
  upperStack.layoutHorizontally();

  const upperTextStack = upperStack.addStack();
  upperTextStack.layoutVertically();

  let staticText_titulo = upperTextStack.addText("Vacunación");
  staticText_titulo.font = Font.boldRoundedSystemFont(14);
  
  widget.addSpacer(3);

  let staticText_argentina = upperTextStack.addText("Argentina:");
  staticText_argentina.font = Font.semiboldRoundedSystemFont(12);

  upperStack.addSpacer();

  let logoImage = upperStack.addImage(await getImage("vac-logo.png"));
  logoImage.imageSize = new Size(30, 30);

  widget.addSpacer(2);
  
  let amountText_porc_arg = widget.addText(resultAr.primeraDosisCantidad.toLocaleString() + " (" + (resultAr.porcentajePrimeraDosis.toLocaleString()*100).toFixed(1) + "%)");
    
  amountText_porc_arg.font = Font.boldSystemFont(13);

  if (resultAr.porcentajePrimeraDosis.toLocaleString()*100 < 25) {
    var color_arg = new Color("#eb3434");
  } else if (resultAr.porcentajePrimeraDosis.toLocaleString()*100 < 50) {
    var color_arg = new Color("#eb9934");
  } else if (resultAr.porcentajePrimeraDosis.toLocaleString()*100 < 75) {
    var color_arg = new Color("#e8eb34");
  } else {
    var color_arg = new Color("#00a86b");
  }
  amountText_porc_arg.textColor = color_arg

  amountText_porc_arg.minimumScaleFactor = 0.8;

  widget.addSpacer(4);

  let progressStack = widget.addStack();
  progressStack.layoutVertically();
  let progressNumberStack = widget.addStack();
  progressNumberStack.layoutHorizontally();
  const progressText0 = progressNumberStack.addText("0%");
  progressText0.font = Font.mediumSystemFont(8);
  progressNumberStack.addSpacer();
  const progressText100 = progressNumberStack.addText("100%");
  progressText100.font = Font.mediumSystemFont(8); 
  progressStack.addImage(createProgress(resultAr.primeraDosisCantidad, color_arg));
  
  //////Provincia//////

  widget.addSpacer(4);

  let staticText_provincia = widget.addText((arg_provincia.toLocaleString() + ":"));
  staticText_provincia.font = Font.semiboldRoundedSystemFont(12);

  widget.addSpacer(2);
    
  let amountText_porc_p= widget.addText(resultProv.primeraDosisCantidad.toLocaleString() + " (" + (resultProv.porcentajePrimeraDosis.toLocaleString()*100).toFixed(1) + "%)");
    
  amountText_porc_p.font = Font.boldSystemFont(13);

  if (resultProv.porcentajePrimeraDosis.toLocaleString()*100 < 25) {
    var color = new Color("#eb3434");
  } else if (resultProv.porcentajePrimeraDosis.toLocaleString()*100 < 50) {
    var color = new Color("#eb9934");
  } else if (resultProv.porcentajePrimeraDosis.toLocaleString()*100 < 75) {
    var color = new Color("#e8eb34");
  } else {
    var color = new Color("#00a86b");
  }
  amountText_porc_p.textColor = color
  amountText_porc_arg.minimumScaleFactor = 0.8

  widget.addSpacer(4);

  let progressStack_prov = widget.addStack();
  progressStack_prov.layoutVertically();
  let progressNumberStack_prov = widget.addStack();
  progressNumberStack_prov.layoutHorizontally();
  const progressText0_prov = progressNumberStack_prov.addText("0%");
  progressText0_prov.font = Font.mediumSystemFont(8);
  progressNumberStack_prov.addSpacer();
  const progressText100_prov = progressNumberStack_prov.addText("100%");
  progressText100_prov.font = Font.mediumSystemFont(8); 
  progressStack_prov.addImage(createProgress_prov(resultProv.primeraDosisCantidad, color));
  }

async function getImage(image) {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, image);
    if (fm.fileExists(path)) {
      return fm.readImage(path);
    } else {
      // download once
      let imageUrl;
      switch (image) {
        case "vac-logo.png":
          imageUrl = "https://i.imgur.com/ZsBNT8E.png";
          break;
        default:
          console.log(`Sorry, couldn't find ${image}.`);
      }
      let req = new Request(imageUrl);
      let loadedImage = await req.loadImage();
      fm.writeImage(path, loadedImage);
      return loadedImage;
    }
  }
async function getNumbers() {
    // Set up the file manager.
    const files = FileManager.local();
  
    // Set up cache
    const cachePath = files.joinPath(
      files.cacheDirectory(),
      "api-cache-covid-vaccine-numbers-mopo"
    );
    const cacheExists = files.fileExists(cachePath);
    const cacheDate = cacheExists ? files.modificationDate(cachePath) : 0;
  
    // Get Data
    try {
      // If cache exists and it's been less than 60 minutes since last request, use cached data.
      if (
        cacheExists &&
        today.getTime() - cacheDate.getTime() < cacheMinutes * 60 * 1000
      ) {
        console.log("Get from Cache - Argentina");
        result = JSON.parse(files.readString(cachePath));
      } else {
        console.log("Get from API");
        const req2 = new Request(
          "https://covid-vacuna-ar.vercel.app/data/latest.json"
        );
        result = await req2.loadJSON();
        console.log("Write Data to Cache");
        try {
          files.writeString(cachePath, JSON.stringify(result));
        } catch (e) {
          console.log("Creating Cache failed!");
          console.log(e);
        }
      }
    } catch (e) {
      console.error(e);
      if (cacheExists) {
        console.log("Get from Cache");
        result = JSON.parse(files.readString(cachePath));
      } else {
        console.log("No fallback to cache possible. Due to missing cache.");
      }
    }
    await setTotalVacNoForArgentina(result);
  }
async function getNumbers_prov() {
    // Set up the file manager.
    const files = FileManager.local();
  
    // Set up cache
    const cachePath = files.joinPath(
      files.cacheDirectory(),
      "api-cache-covid-vaccine-numbers-mopo5"
    );
    const cacheExists = files.fileExists(cachePath);
    const cacheDate = cacheExists ? files.modificationDate(cachePath) : 0;
  
    // Get Data
    try {
      // If cache exists and it's been less than 60 minutes since last request, use cached data.
      if (
        cacheExists &&
        today.getTime() - cacheDate.getTime() < cacheMinutes * 60 * 1000
      ) {
        console.log("Get from Cache - Provincia");
        result = JSON.parse(files.readString(cachePath));
      } else {
        console.log("Get from API");
        const req2 = new Request(
          "https://covid-vacuna-ar.vercel.app/data/latest.json"
        );
        result = await req2.loadJSON();
        console.log("Write Data to Cache");
        try {
          files.writeString(cachePath, JSON.stringify(result));
        } catch (e) {
          console.log("Creating Cache failed!");
          console.log(e);
        }
      }
    } catch (e) {
      console.error(e);
      if (cacheExists) {
        console.log("Get from Cache");
        result = JSON.parse(files.readString(cachePath));
      } else {
        console.log("No fallback to cache possible. Due to missing cache.");
      }
    }
    await setTotalVacNoForProvincia(result);
  }
async function setTotalVacNoForArgentina(result) {
    for (var i = result.length - 1; i >= 0; i--) {
      let currentItem = result[i];
      if (currentItem["jurisdiccionCodigoIndec"] === 0) {
        resultAr = currentItem;
      }
    }
  }
async function setTotalVacNoForProvincia(result_prov) {
    for (var i = result_prov.length - 1; i >= 0; i--) {
      let currentItem_prov = result_prov[i];
      let provincia_args = arg_provincia;
      if (currentItem_prov["jurisdiccionNombre"] === arg_provincia) {
        resultProv = currentItem_prov;
      }
    }
  }
function createProgress(currentVacNo, color_arg) {
    const context = new DrawContext();
    context.size = new Size(width, h);
    context.opaque = false;
    context.respectScreenScale = true;
    context.setFillColor(new Color("#d2d2d7"));
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, width, h), 3, 2);
    context.addPath(path);
    context.fillPath();
    context.setFillColor(color_arg);
    const path1 = new Path();
    const path1width =
      (width * currentVacNo) / (resultAr.primeraDosisCantidad/resultAr.porcentajePrimeraDosis) > width
        ? width
        : (width * currentVacNo) / (resultAr.primeraDosisCantidad/resultAr.porcentajePrimeraDosis);
    path1.addRoundedRect(new Rect(0, 0, path1width, h), 3, 2);
    context.addPath(path1);
    context.fillPath();
    return context.getImage();
  }
function createProgress_prov(currentVacNo, color) {
    const context = new DrawContext();
    context.size = new Size(width, h);
    context.opaque = false;
    context.respectScreenScale = true;
    context.setFillColor(new Color("#d2d2d7"));
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, width, h), 3, 2);
    context.addPath(path);
    context.fillPath();
    context.setFillColor(color);
    const path1 = new Path();
    const path1width =
      (width * currentVacNo) / (resultProv.primeraDosisCantidad/resultProv.porcentajePrimeraDosis) > width
        ? width
        : (width * currentVacNo) / (resultProv.primeraDosisCantidad/resultProv.porcentajePrimeraDosis);
    path1.addRoundedRect(new Rect(0, 0, path1width, h), 3, 2);
    context.addPath(path1);
    context.fillPath();
    return context.getImage();
  }
function round(value, decimals) {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
  }