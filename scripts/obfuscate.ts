import * as fs from 'fs';
import * as path from 'path';
import * as JavaScriptObfuscator from 'javascript-obfuscator';

// Configuration for the obfuscator
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 3000, // Changed from boolean to number (milliseconds)
  disableConsoleOutput: false, // Keep console output for debugging
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false, // Be careful with this option
  rotateStringArray: true,
  selfDefending: true,
  shuffleStringArray: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false // This can cause issues with some character sets
};

// Function to recursively process all JS files in a directory
function processDirectory(directory: string) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(fullPath);
    } else if (path.extname(file) === '.js') {
      // Obfuscate JavaScript files
      obfuscateFile(fullPath);
    }
  }
}

// Function to obfuscate a single file
function obfuscateFile(filePath: string) {
  console.log(`Obfuscating: ${filePath}`);
  
  try {
    // Read the file
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Obfuscate the code
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code).getObfuscatedCode();
    
    // Write the obfuscated code back to the file
    fs.writeFileSync(filePath, obfuscatedCode);
    
    console.log(`Successfully obfuscated: ${filePath}`);
  } catch (error) {
    console.error(`Error obfuscating ${filePath}:`, error);
  }
}

// Main function
function main() {
  const distPath = path.resolve(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('Dist directory does not exist!');
    process.exit(1);
  }
  
  console.log('Starting obfuscation process...');
  processDirectory(distPath);
  console.log('Obfuscation complete!');
}

// Run the main function
main();