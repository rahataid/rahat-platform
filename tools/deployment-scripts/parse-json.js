const fs = require('fs');
const path = require('path');
const readline = require('readline');

const deploymentsDir = path.join(__dirname, 'deployments');

function tryParseJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

function deepParse(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepParse);
  } else if (obj && typeof obj === 'object') {
    const out = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        out[key] = tryParseJSON(obj[key]);
      } else {
        out[key] = deepParse(obj[key]);
      }
    }
    return out;
  }
  return obj;
}

function listJsonFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'));
}

async function main() {
  const files = listJsonFiles(deploymentsDir);
  if (files.length === 0) {
    console.log('No JSON files found in deployments directory.');
    return;
  }
  console.log('Available JSON files:');
  files.forEach((f, i) => console.log(`${i + 1}: ${f}`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the number of the file to parse: ', (answer) => {
    const idx = parseInt(answer, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= files.length) {
      console.log('Invalid selection.');
      rl.close();
      return;
    }
    const inputPath = path.join(deploymentsDir, files[idx]);
    const outputPath = inputPath.replace(/\.json$/, '.pretty.json');
    const raw = fs.readFileSync(inputPath, 'utf8');
    const json = JSON.parse(raw);
    const parsed = deepParse(json);
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf8');
    console.log('Saved pretty JSON to', outputPath);
    rl.close();
  });
}

main();