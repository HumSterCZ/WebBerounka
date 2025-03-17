const fs = require("fs");
const path = require("path");

// Základní konfigurace
const config = {
  cssDir: path.join(__dirname, "public", "css"),
  mainFile: "styles.css",
  outputFile: path.join(__dirname, "public", "css", "styles.css"),
};

// Funkce pro zpracování cesty k importovanému souboru
function resolveImportPath(importPath, currentDir) {
  // Odstranění uvozovek a apostrofů
  importPath = importPath.replace(/['"]/g, "");

  // Vyřešení relativní cesty
  return path.resolve(currentDir, importPath);
}

// Funkce pro načtení obsahu CSS souboru
function readCSSFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (err) {
    console.error(`Chyba při čtení souboru ${filePath}: ${err.message}`);
    return "";
  }
}

// Hlavní funkce pro zpracování CSS souboru a jeho importů
function processCSSFile(filePath, processedFiles = new Set()) {
  if (processedFiles.has(filePath)) {
    return ""; // Zabráníme nekonečným smyčkám
  }

  processedFiles.add(filePath);

  const fileDir = path.dirname(filePath);
  let cssContent = readCSSFile(filePath);

  // Hledání a zpracování @import příkazů
  const importRegex = /@import\s+(?:url\()?['"]?([^'";\)]+)['"]?\)?;/g;
  let match;
  let result = "";
  let lastIndex = 0;

  while ((match = importRegex.exec(cssContent)) !== null) {
    // Přidání textu před @import
    result += cssContent.slice(lastIndex, match.index);

    const importedPath = resolveImportPath(match[1], fileDir);

    // Zpracování importovaného souboru
    const importedContent = processCSSFile(importedPath, processedFiles);
    result += importedContent;

    lastIndex = match.index + match[0].length;
  }

  // Přidání zbývajícího textu po posledním @import
  result += cssContent.slice(lastIndex);

  return result;
}

// Funkce pro zápis výsledného CSS do souboru
function writeOutputFile(content) {
  try {
    // Vytvoříme zálohu původního souboru
    const originalContent = fs.readFileSync(config.outputFile, "utf8");
    fs.writeFileSync(`${config.outputFile}.backup`, originalContent);

    // Zapíšeme nový obsah
    fs.writeFileSync(config.outputFile, content);
    console.log(`CSS soubory byly úspěšně sloučeny do ${config.outputFile}`);
  } catch (err) {
    console.error(`Chyba při zápisu výsledného CSS: ${err.message}`);
  }
}

// Hlavní funkce
function buildCSS() {
  const mainFilePath = path.join(config.cssDir, config.mainFile);

  console.log(`Zpracování hlavního CSS souboru: ${mainFilePath}`);
  const processedCSS = processCSSFile(mainFilePath);

  // Přidání komentáře informujícího o vygenerování souboru
  const result = `/*\n * Tento soubor byl automaticky vygenerován - sloučení všech CSS modulů\n * Vygenerováno: ${new Date().toLocaleString()}\n */\n\n${processedCSS}`;

  writeOutputFile(result);
}

// Spuštění buildu
buildCSS();
