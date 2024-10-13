const fs = require('fs');
const path = require('path');

// Paths to your assets folders
const assetsDir = path.join(__dirname, 'assets');
const bordersDir = path.join(assetsDir, 'Borders');
const cellsDir = path.join(assetsDir, 'Cells');
const numbersDir = path.join(assetsDir, 'Numbers');
const additionalNumbersDir = path.join(assetsDir, 'AdditionalNumbers');

// Helper function to read directory and return sorted file names without extensions
function getFileNames(directory) {
    return fs.readdirSync(directory)
        .filter(file => path.extname(file) === '.gltf') // Only include .gltf files
        .map(file => path.basename(file, '.gltf')) // Remove file extensions
        .sort();
}

// Fetch parts from directories
const borders = getFileNames(bordersDir);
const cells = getFileNames(cellsDir);
const numbers = getFileNames(numbersDir);
const additionalNumbers = getFileNames(additionalNumbersDir);

// Create the partsList object
const partsList = {
    borders,
    cells,
    numbers,
    notes: additionalNumbers  // Include additional numbers under "notes"
};

// Write to partsList.json
const outputPath = path.join(__dirname, 'partsList.json');
fs.writeFileSync(outputPath, JSON.stringify(partsList, null, 2));

console.log('partsList.json has been created/updated successfully.');
