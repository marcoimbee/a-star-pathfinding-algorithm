document.addEventListener('DOMContentLoaded', async function() {

    const ROWS = 50;
    const COLS = 50;
    const GRID_DIM = ROWS * COLS;
    const TOT_OBSTACLES = 1000;
    const DISTANCE_FUNCTION = 'Manhattan';
    const CONSIDER_DIAGONALS = 1;
    const OFFSETS_FILE = 'res/neighbor_map.json';

    let cells = createGrid(ROWS, COLS);
    setupObstacles(cells, TOT_OBSTACLES, GRID_DIM);

    // console.log(cells);

    let finalPath = null;

    let start = 0;
    let goal = GRID_DIM - 1;

    let openList = new Array();         // Array of cell IDs!
    let closedList = new Array();       // Array of cell IDs!
    let cameFrom = new Map();

    const offsets = await loadOffsets(OFFSETS_FILE);        // NEIGHBOR OFFSETS

    // Start cell init
    cells[start].setGScore(0);          // Set g score of start cell to 0
    cells[start].setFScore(             // Set f score of start cell to h(start)
        computeHValue(
            cells[start], 
            cells[goal], 
            DISTANCE_FUNCTION
        )
    );    
    
    // let obstacles = cells.filter(cell => cell.getIsObstacle() == true);
    // console.table(obstacles);
    
    openList.push(cells[start].getId());        // Add start cell to open list. f value is set before

    console.time("EXECUTION TIME");

    let iterCounter = 0;
    while (openList.length != 0) {

        let currentCell = getLowestFScoreCell(cells, openList);       // Find cell with lowest f score
        // console.log("currentCell: ", currentCell);

        if (currentCell == null) {
            console.timeEnd("EXECUTION TIME");
            console.log("No valid cells left to explore");
            console.log("FAILURE!");
            break;
        }

        if (currentCell.getId() == goal) {       // Goal is reached, reconstruct the path
            console.log("FINISHED");
            // console.log("CURRENT CELL: ", currentCell);
            finalPath = reconstructPath(cameFrom, currentCell);

            console.timeEnd("EXECUTION TIME");

            await displayFinalPath(finalPath, 15);

            break;
        }

        closedList.push(currentCell.getId());       // Mark current cell as visited
        openList = openList.filter(cellId =>         // Remove current cell from open list
            !(cellId == currentCell.getId())
        );


        // Explore neighbors of the current cell
        let currentCellNeighbors = getNeighbors(currentCell, cells, ROWS, COLS, offsets, CONSIDER_DIAGONALS);
        await displayNeighbors(currentCellNeighbors, 20);
        
        currentCellNeighbors.forEach(neighbor => {

            // If neighbor is not an obstacle or is in closed list go on
            if (!(neighbor.getIsObstacle() || closedList.includes(neighbor.getId()))) {

                let tentativeG = currentCell.getGScore() + 1;       // Potential cost of reaching neighbor cell through current cell
            
                if (tentativeG < neighbor.getGScore()) {    // If neighbor is not in open_list or a better path is found
                    cameFrom.set(neighbor.getId(), currentCell);        
                    neighbor.setGScore(tentativeG);
                    neighbor.setFScore(neighbor.getGScore() + computeHValue(neighbor, cells[goal], DISTANCE_FUNCTION));
                
                    // Check if neighbor is already in open list
                    if (!openList.includes(neighbor.getId())) {
                        openList.push(neighbor.getId());        // Add neighbor to open list
                    }
                }
            }
        });

        // Check if no path exists from start to goal cell
        if (openList.length == 0 && currentCell.getId() != goal) {
            console.log("Goal is unreachable in this configuration.");
            console.timeEnd("EXECUTION TIME");
            await displayUnreachable(closedList, 5);
            return;
        }

        iterCounter++;
    }
});

async function displayUnreachable(closedList, ms) {
    for (const cell of closedList) {
        let divElement = document.getElementById('cell_' + cell);
        divElement.classList.add('unreachable-destination-cell');
        await delay(ms);
    }
}

async function displayNeighbors(neighbors, ms) {
    neighbors = neighbors.filter(neigh => neigh.getIsObstacle() == false);
    for (const neighbor of neighbors) {
        let divElement = document.getElementById('cell_' + neighbor.getId());
        divElement.classList.add('visited-neighbor-cell');
        await delay(ms);           // Wait for x ms before coloring the next cell
    }
}

async function displayFinalPath(path, ms) {
    for (const cell of path) {
        let divElement = document.getElementById('cell_' + cell.getId());
        divElement.classList.add('final-path-cell');
        await delay(ms);           // Wait for 200 ms before coloring the next cell
    }
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function getNeighbors(cell, cells, rows, cols, offsets, considerDiagonals) {
    let neighbors = [];

    const { mainOffsets, diagonalOffsets } = offsets;

    // Determine the type of cell and corresponding offsets
    let cellType = undefined;
    if (cell.isCentralCell(rows, cols)) cellType = 'central';
    else if (cell.isTopRowCell()) cellType = 'topRow';
    else if (cell.isBottomRowCell(rows)) cellType = 'bottomRow';
    else if (cell.isLeftColumnCell()) cellType = 'leftColumn';
    else if (cell.isRightColumnCell(cols)) cellType = 'rightColumn';
    else if (cell.isTopLeftCornerCell()) cellType = 'topLeftCorner';
    else if (cell.isTopRightCornerCell(cols)) cellType = 'topRightCorner';
    else if (cell.isBottomLeftCornerCell(rows)) cellType = 'bottomLeftCorner';
    else if (cell.isBottomRightCornerCell(rows, cols)) cellType = 'bottomRightCorner';

    // Use the offsets for the identified cell type
    if (cellType) {
        mainOffsets[cellType].forEach(offset => {
            const x = cell.getX() + offset[0];
            const y = cell.getY() + offset[1];
            const neighbor = getCellFromCoordinates(x, y, cells);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        });

        if (considerDiagonals) {            // Get diagonal neighbors if enabled
            diagonalOffsets[cellType].forEach(offset => {
                const x = cell.getX() + offset[0];
                const y = cell.getY() + offset[1];
                const neighbor = getCellFromCoordinates(x, y, cells);
                if (neighbor) {
                    neighbors.push(neighbor);
                }
            });
        }
    }

    return neighbors;
}


async function loadOffsets(offsetFileName) {
    const response = await fetch(offsetFileName);       // JSON file
    const offsets = await response.json();
    
    return offsets;
}


function getCellFromCoordinates(x, y, cells) {
    return cells.find(cell => cell.getX() === x && cell.getY() === y);
}


function reconstructPath(cameFrom, currentCell) {
    finalPath = [];
    finalPath.push(currentCell);

    // While the start cell isn't reached
    while (cameFrom.has(currentCell.getId())) {             // Structural equality
        currentCell = cameFrom.get(currentCell.getId());        // Move to the parent from the current cell
        
        finalPath.unshift(currentCell);     // Add cell to the start of the path 
    }

    console.log("FINAL PATH: ", finalPath);

    return finalPath;
}


function getLowestFScoreCell(cells, openList) {
    let currFScore = Infinity;
    let lowestFScoreCell = null;

    openList.forEach(cellId => {
        let cell = cells[cellId];
        if (cell.getFScore() < currFScore) {
            currFScore = cell.getFScore();
            lowestFScoreCell = cell;
        }
    });

    return lowestFScoreCell;
}

function computeHValue(currCell, goalCell, distanceFunction) {
    switch (distanceFunction) {
        case 'Manhattan':
            return (Math.abs(goalCell.x - currCell.x) + Math.abs(goalCell.y - currCell.y));
        case 'Euclidean':
            return Math.sqrt(Math.pow(goalCell.x - currCell.x, 2) + Math.pow(goalCell.y - currCell.y, 2));
        case 'Chebyshev':
            return Math.max(Math.abs(goalCell.x - currCell.x), Math.abs(goalCell.y - currCell.y));
    }
}


function createGrid(rows, cols) {
    let counter = 0;
    let cells = [];
    let gridDiv = document.getElementById('grid');

    for (let i = 0; i < rows; i++) {
        let newRow = document.createElement('div');
        newRow.setAttribute('class', 'row');
        for (let j = 0; j < cols; j++) {
            let newCell = document.createElement('div');
            newCell.setAttribute('class', 'cell');
            newCell.setAttribute('id', 'cell_' + counter);
            // newCell.textContent = i + ',' + j;
            // newCell.textContent = counter;
            newRow.appendChild(newCell);

            cells.push(new Cell(counter, i, j, false));

            counter++;
        }
        gridDiv.appendChild(newRow);
    }

    return cells;
}

function setupObstacles(cells, howMany, gridDimension) {
    let obstaclesId = new Array();

    while (obstaclesId.length < howMany) {
        let rand = Math.floor(Math.random() * (gridDimension - 2)) + 1;
        if (!obstaclesId.includes(rand)) {
            obstaclesId.push(rand);

            cells[rand].setIsObstacle(true);

            let extractedObstacle = document.getElementById('cell_' + rand);
            extractedObstacle.classList.add('obstacle-cell');
        }
    }
}
