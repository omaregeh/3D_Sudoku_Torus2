document.addEventListener('DOMContentLoaded', () => {
    // Define sudokuSolution globally
    let sudokuSolution = [];
    let helperNumbersVisible = true;  // Track helper numbers visibility

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(0, 5, 3);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const loader = new THREE.GLTFLoader();
    const cellsGroup = new THREE.Group();
    const bordersGroup = new THREE.Group();
    const numbersGroup = new THREE.Group();
    const notesGroup = new THREE.Group();  // Group for notes
    cellsGroup.scale.set(5, 5, 5);
    bordersGroup.scale.set(5, 5, 5);
    numbersGroup.scale.set(5, 5, 5);
    notesGroup.scale.set(5, 5, 5);
    scene.add(cellsGroup);
    scene.add(bordersGroup);
    scene.add(numbersGroup);
    scene.add(notesGroup);

    const controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 5.0;
    controls.dynamicDampingFactor = 0.3;
    controls.noZoom = true;
    controls.noPan = true;
    controls.target.set(0, 0, 0);
    controls.update();

    // Create button to toggle helper numbers
    const button = document.createElement('button');
    button.textContent = 'Toggle Helper Numbers';
    button.style.position = 'absolute';
    button.style.top = '10px';
    button.style.left = '10px';
    button.style.padding = '10px';
    button.style.backgroundColor = '#008CBA';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    document.body.appendChild(button);

    // Button click event to toggle visibility of helper numbers
    button.addEventListener('click', () => {
        helperNumbersVisible = !helperNumbersVisible;
        notesGroup.children.forEach((note) => {
            note.traverse((child) => {
                if (child.isMesh) {
                    child.visible = helperNumbersVisible;
                }
            });
        });
    });

    // Loading JSON files
    Promise.all([
        fetch('partsList.json').then(response => response.json()),
        fetch('sudokuGame.json').then(response => response.json())
    ]).then(([partsListData, sudokuGameData]) => {
        const { borders, cells, numbers } = partsListData;
        const { sudokuBoard, sudokuSolution: solution } = sudokuGameData;

        // Assign sudokuSolution to the global variable
        sudokuSolution = solution;

        loadParts(borders, 'assets/Borders', bordersGroup);
        loadParts(cells, 'assets/Cells', cellsGroup);
        loadParts(numbers, 'assets/Numbers', numbersGroup, 0x000000, false);

        setupSudokuMechanics(cells, sudokuBoard);
        addNotesToEmptyCells(cells, sudokuBoard);  // Add notes to empty cells
    }).catch(error => console.error('Error loading parts list or Sudoku game:', error));

    function loadParts(partNames, folderPath, group, materialColor = null, initiallyVisible = true) {
        partNames.forEach(partName => {
            const filePath = `${folderPath}/${partName}.gltf`;
            loader.load(filePath, (gltf) => {
                const part = gltf.scene;
                part.name = partName;
                part.traverse((child) => {
                    if (child.isMesh) {
                        if (materialColor !== null) {
                            child.material = new THREE.MeshStandardMaterial({ color: materialColor });
                        }
                        child.visible = initiallyVisible;
                    }
                });
                group.add(part);
            }, undefined, (error) => {
                console.error(`Error loading ${partName}:`, error);
            });
        });

        if (!scene.children.includes(group)) {
            scene.add(group);
        }
    }

    function parseCellName(cellName) {
        const match = cellName.match(/(Sub_\d+)_Cell_(\d+_\d+)/);
        if (match) {
            return [match[1], match[2]];
        }
        throw new Error(`Invalid cell name: ${cellName}`);
    }

    const editableCells = new Set();
    const cellNumberMap = new Map();
    let userSudokuBoard = [];

    function setupSudokuMechanics(cells, sudokuBoard) {
        userSudokuBoard = JSON.parse(JSON.stringify(sudokuBoard)); // Copy of initial board

        const subGridMapping = {
            "Sub_1": { startRow: 0, startCol: 0 },
            "Sub_2": { startRow: 0, startCol: 3 },
            "Sub_3": { startRow: 0, startCol: 6 },
            "Sub_4": { startRow: 3, startCol: 0 },
            "Sub_5": { startRow: 3, startCol: 3 },
            "Sub_6": { startRow: 3, startCol: 6 },
            "Sub_7": { startRow: 6, startCol: 0 },
            "Sub_8": { startRow: 6, startCol: 3 },
            "Sub_9": { startRow: 6, startCol: 6 }
        };

        cells.forEach((cellName, index) => {
            const [sub, cell] = parseCellName(cellName);
            const { startRow, startCol } = subGridMapping[sub];
            const [subRow, subCol] = cell.split('_').map(Number);
            const row = startRow + (subRow - 1);
            const col = startCol + (subCol - 1);
            const value = sudokuBoard[row][col];
            if (value === 0) {
                editableCells.add(cellName);
            } else {
                const numberName = `${cellName}_Number_${value}`;
                cellNumberMap.set(cellName, numberName);
                loadParts([numberName], 'assets/Numbers', numbersGroup, 0x000000, true);
            }
        });
    }

    function addNotesToEmptyCells(cells, sudokuBoard) {
        cells.forEach((cellName) => {
            const [sub, cell] = parseCellName(cellName);
            const { startRow, startCol } = {
                "Sub_1": { startRow: 0, startCol: 0 },
                "Sub_2": { startRow: 0, startCol: 3 },
                "Sub_3": { startRow: 0, startCol: 6 },
                "Sub_4": { startRow: 3, startCol: 0 },
                "Sub_5": { startRow: 3, startCol: 3 },
                "Sub_6": { startRow: 3, startCol: 6 },
                "Sub_7": { startRow: 6, startCol: 0 },
                "Sub_8": { startRow: 6, startCol: 3 },
                "Sub_9": { startRow: 6, startCol: 6 }
            }[sub];
            const [subRow, subCol] = cell.split('_').map(Number);
            const row = startRow + (subRow - 1);
            const col = startCol + (subCol - 1);

            if (sudokuBoard[row][col] === 0) {  // Check if cell is empty
                const possibleNumbers = getPossibleNumbers(row, col, sudokuBoard); // Get valid numbers
                possibleNumbers.forEach(num => {
                    const noteName = `${cellName}_New_Number_${num}`;
                    loadParts([noteName], 'assets/AdditionalNumbers', notesGroup, 0x000080, true); // Load as dark blue notes
                });
            }
        });
    }

    function getPossibleNumbers(row, col, board) {
        const possible = new Set(Array.from({ length: 9 }, (_, i) => i + 1));
        for (let i = 0; i < 9; i++) {
            possible.delete(board[row][i]);  // Remove numbers from the same row
            possible.delete(board[i][col]);  // Remove numbers from the same column
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                possible.delete(board[i][j]);  // Remove numbers from the same 3x3 grid
            }
        }
        return Array.from(possible);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedCell = null;

    function onMouseClick(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(cellsGroup.children, true);
        if (intersects.length > 0) {
            const intersected = intersects[0].object.parent;
            if (editableCells.has(intersected.name)) {
                if (selectedCell === intersected) {
                    selectedCell.traverse((child) => {
                        if (child.isMesh) child.material.color.set(0xffffff);
                    });
                    selectedCell = null;
                } else {
                    if (selectedCell) {
                        selectedCell.traverse((child) => {
                            if (child.isMesh) child.material.color.set(0xffffff);
                        });
                    }
                    selectedCell = intersected;
                    selectedCell.traverse((child) => {
                        if (child.isMesh) child.material.color.set(0xffff00);
                    });
                }
            }
        }
    }

    window.addEventListener('click', onMouseClick);

    window.addEventListener('keypress', (event) => {
        if (selectedCell && event.key >= '1' && event.key <= '9') {
            const cellName = selectedCell.name;
            const numberToShow = `${cellName}_Number_${event.key}`;

            const [sub, cell] = parseCellName(cellName);
            const { startRow, startCol } = {
                "Sub_1": { startRow: 0, startCol: 0 },
                "Sub_2": { startRow: 0, startCol: 3 },
                "Sub_3": { startRow: 0, startCol: 6 },
                "Sub_4": { startRow: 3, startCol: 0 },
                "Sub_5": { startRow: 3, startCol: 3 },
                "Sub_6": { startRow: 3, startCol: 6 },
                "Sub_7": { startRow: 6, startCol: 0 },
                "Sub_8": { startRow: 6, startCol: 3 },
                "Sub_9": { startRow: 6, startCol: 6 }
            }[sub];
            const [subRow, subCol] = cell.split('_').map(Number);
            const row = startRow + (subRow - 1);
            const col = startCol + (subCol - 1);

            userSudokuBoard[row][col] = parseInt(event.key);

            if (cellNumberMap.get(cellName) === numberToShow) {
                numbersGroup.children.forEach((number) => {
                    if (number.name === numberToShow) {
                        number.traverse((child) => {
                            if (child.isMesh) child.visible = false;
                        });
                    }
                });
                cellNumberMap.delete(cellName);
            } else {
                if (cellNumberMap.has(cellName)) {
                    const previousNumber = cellNumberMap.get(cellName);
                    numbersGroup.children.forEach((number) => {
                        if (number.name === previousNumber) {
                            number.traverse((child) => {
                                if (child.isMesh) child.visible = false;
                            });
                        }
                    });
                }
                numbersGroup.children.forEach((number) => {
                    if (number.name === numberToShow) {
                        number.traverse((child) => {
                            if (child.isMesh) child.visible = true;
                        });
                    }
                });
                cellNumberMap.set(cellName, numberToShow);
            }

            // Update the notes in other cells
            updateNotes(row, col, event.key);

            if (checkIfSudokuComplete()) {
                setTimeout(() => {
                    alert("Congratulations! You've completed the Sudoku!");
                }, 100);
            }
        }
    });

    function updateNotes(row, col, value) {
        const subGridMapping = [
            { rowStart: 0, colStart: 0 },
            { rowStart: 0, colStart: 3 },
            { rowStart: 0, colStart: 6 },
            { rowStart: 3, colStart: 0 },
            { rowStart: 3, colStart: 3 },
            { rowStart: 3, colStart: 6 },
            { rowStart: 6, colStart: 0 },
            { rowStart: 6, colStart: 3 },
            { rowStart: 6, colStart: 6 },
        ];

        // Update all notes in the same row, column, and 3x3 grid
        for (let i = 0; i < 9; i++) {
            removeNoteFromCell(row, i, value);
            removeNoteFromCell(i, col, value);
        }

        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = boxRow; i < boxRow + 3; i++) {
            for (let j = boxCol; j < boxCol + 3; j++) {
                removeNoteFromCell(i, j, value);
            }
        }
    }

    function removeNoteFromCell(row, col, value) {
        const cellName = `Sub_${Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1}_Cell_${(row % 3) + 1}_${(col % 3) + 1}`;
        const noteName = `${cellName}_New_Number_${value}`;
        notesGroup.children.forEach((note) => {
            if (note.name === noteName) {
                note.traverse((child) => {
                    if (child.isMesh) child.visible = false;
                });
            }
        });
    }

    function checkIfSudokuComplete() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userSudokuBoard[row][col] !== sudokuSolution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        controls.handleResize();
    });
});
