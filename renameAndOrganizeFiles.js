const fs = require('fs');
const path = require('path');

// Define the directory containing your GLTF files
const directoryPath = path.join(__dirname, '3D_Sudoku_Torus', 'assets2');

// Define the target folders for organization
const bordersPath = path.join(directoryPath, 'Borders');
const cellsPath = path.join(directoryPath, 'Cells');
const numbersPath = path.join(directoryPath, 'Numbers');

// Helper function to ensure the directory exists
function ensureDirectoryExistence(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// Ensure target directories exist
ensureDirectoryExistence(bordersPath);
ensureDirectoryExistence(cellsPath);
ensureDirectoryExistence(numbersPath);

// Read all files in the directory
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Loop through each file
    files.forEach(file => {
        // Check if the file name contains "Assembly 1 - "
        if (file.startsWith("Assembly 1 - ")) {
            // Create the new file name by removing the prefix
            const newFileName = file.replace("Assembly 1 - ", "");

            // Get the old and new file paths
            const oldFilePath = path.join(directoryPath, file);

            let newFilePath;

            // Organize the files into the correct folders based on name
            if (newFileName.includes("Border")) {
                newFilePath = path.join(bordersPath, newFileName);
            } else if (newFileName.includes("Cell")) {
                newFilePath = path.join(cellsPath, newFileName);
            } else if (newFileName.includes("Number")) {
                newFilePath = path.join(numbersPath, newFileName);
            }

            if (newFilePath) {
                // Rename and move the file to the correct folder
                fs.rename(oldFilePath, newFilePath, (err) => {
                    if (err) {
                        console.error('Error renaming file:', err);
                    } else {
                        console.log(`Moved and renamed: ${file} -> ${newFileName}`);
                    }
                });
            }
        }
    });
});
