document.addEventListener('DOMContentLoaded', () => {
    // Define sudokuSolution globally
    let sudokuSolution = [];

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
    cellsGroup.scale.set(5, 5, 5);
    bordersGroup.scale.set(5, 5, 5);
    numbersGroup.scale.set(5, 5, 5);
    scene.add(cellsGroup);
    scene.add(bordersGroup);
    scene.add(numbersGroup);

    const controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 5.0;
    controls.dynamicDampingFactor = 0.3;
    controls.noZoom = true;
    controls.noPan = true;
    controls.target.set(0, 0, 0);
    const originalUpdate = controls.update;
    controls.update = function () {
        controls.target.set(0, 0, 0);
        originalUpdate.call(controls);
    };

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

            // Update the user's board
            const [sub, cell] = parseCellName(cellName);
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
            const { startRow, startCol } = subGridMapping[sub];
            const [subRow, subCol] = cell.split('_').map(Number);
            const row = startRow + (subRow - 1);
            const col = startCol + (subCol - 1);

            userSudokuBoard[row][col] = parseInt(event.key);

            // Log the input and its location
            console.log(`Input number: ${event.key}, in cell: ${cellName}, row: ${row}, col: ${col}`);

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

            // Check if the Sudoku is complete
            if (checkIfSudokuComplete()) {
                setTimeout(() => {
                    alert("Congratulations! You've completed the Sudoku!");
                }, 100);
            } else {
                // Check if there are incorrect values
                if (checkIfSudokuIncorrect()) {
                    setTimeout(() => {
                        alert("Oops, there are some incorrect values. Try again!");
                    }, 100);
                }
            }
        }
    });

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

    function checkIfSudokuIncorrect() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (userSudokuBoard[row][col] !== 0 && userSudokuBoard[row][col] !== sudokuSolution[row][col]) {
                    return true;
                }
            }
        }
        return false;
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
