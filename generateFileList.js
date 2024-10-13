const fs = require('fs');
const path = require('path');

// Define the base folder path where the assets folder is located (on your desktop)
const baseFolder = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop', '3D_Sudoku_Torus2', 'assets');

// Define subfolders that you want to scan (Cells, Numbers, AdditionalNumbers)
const subFolders = ['Cells', 'Numbers', 'AdditionalNumbers'];

// Output file to save the file names
const outputFilePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop', 'fileNames.txt');

// Function to recursively read the folder and get file names
function getFileNamesFromFolder(folderPath, folderName) {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const fileNames = [];

    files.forEach((file) => {
        if (file.isFile()) {
            const filePath = path.join(folderName, file.name);
            fileNames.push(filePath);
        }
    });

    return fileNames;
}

// Function to generate the file list and save it to a text file
function generateFileList() {
    const allFiles = [];

    subFolders.forEach((subFolder) => {
        const folderPath = path.join(baseFolder, subFolder);
        if (fs.existsSync(folderPath)) {
            const files = getFileNamesFromFolder(folderPath, subFolder);
            allFiles.push(...files);
        } else {
            console.error(`Folder not found: ${folderPath}`);
        }
    });

    // Write the file names to the output file
    fs.writeFileSync(outputFilePath, allFiles.join('\n'), 'utf8');
    console.log(`File names have been saved to ${outputFilePath}`);
}

// Run the script to generate the file list
generateFileList();
