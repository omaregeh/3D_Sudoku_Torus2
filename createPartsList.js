const fs = require('fs');
const path = require('path');

const assetsDirectory = path.join(__dirname, 'assets');
const outputFilePath = path.join(__dirname, 'partsList.json');

const partCategories = {
    borders: [],
    cells: [],
    numbers: []
};

function categorizeFile(fileName, category) {
    if (fileName.includes('Major_Border') || fileName.includes('Minor_Border')) {
        category.borders.push(fileName.replace('.gltf', ''));
    } else if (fileName.includes('Cell') && !fileName.includes('Number')) {
        category.cells.push(fileName.replace('.gltf', ''));
    } else if (fileName.includes('Number')) {
        category.numbers.push(fileName.replace('.gltf', ''));
    }
}

function readDirectory(directoryPath, category) {
    const items = fs.readdirSync(directoryPath);

    items.forEach(item => {
        const itemPath = path.join(directoryPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            readDirectory(itemPath, category);
        } else if (stats.isFile() && path.extname(item) === '.gltf') {
            categorizeFile(item, category);
        }
    });
}

readDirectory(assetsDirectory, partCategories);

fs.writeFileSync(outputFilePath, JSON.stringify(partCategories, null, 2));

console.log(`Parts list has been successfully created at ${outputFilePath}`);
