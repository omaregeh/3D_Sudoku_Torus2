const fs = require('fs');
const path = require('path');

// Define the directory containing your files
const directoryPath = path.join(__dirname, 'assets2');

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
            const newFilePath = path.join(directoryPath, newFileName);

            // Rename the file
            fs.rename(oldFilePath, newFilePath, (err) => {
                if (err) {
                    console.error('Error renaming file:', err);
                } else {
                    console.log(`Renamed: ${file} -> ${newFileName}`);
                }
            });
        }
    });
});
