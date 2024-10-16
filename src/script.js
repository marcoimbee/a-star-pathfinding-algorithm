
document.addEventListener('DOMContentLoaded', async function() {

    const ROWS = 50;
    const COLS = 50;
    const GRID_DIM = ROWS * COLS;
    const TOT_OBSTACLES = 1000;
    const DISTANCE_FUNCTION = 'Manhattan';
    const CONSIDER_DIAGONALS = 1;
    const OFFSETS_FILE = 'res/neighbor_map.json';

    let nodes = createGrid(ROWS, COLS);
    setupObstacles(nodes, TOT_OBSTACLES, GRID_DIM);

    // console.log(nodes);

    let finalPath = null;

    let start = 0;
    let goal = GRID_DIM - 1;

    let openList = new Array();         // Array of Node IDs!
    let closedList = new Array();       // Array of Node IDs!
    let cameFrom = new Map();

    const offsets = await loadOffsets(OFFSETS_FILE);        // NEIGHBOR OFFSETS

    // Start node init
    nodes[start].setGScore(0);          // Set g score of start node to 0
    nodes[start].setFScore(             // Set f score of start node to h(start)
        computeHValue(
            nodes[start], 
            nodes[goal], 
            DISTANCE_FUNCTION
        )
    );    

    console.log("ZOOM LEVEL: ", window.devicePixelRatio);
    
    // let obstacles = nodes.filter(node => node.getIsObstacle() == true);
    // console.table(obstacles);
    
    openList.push(nodes[start].getId());        // Add start node to open list. f value is set before

    console.time("EXECUTION TIME");

    let iterCounter = 0;
    while (openList.length != 0) {

        let currentNode = getLowestFScoreNode(nodes, openList);       // Find node with lowest f score
        // console.log("currentNode: ", currentNode);

        if (currentNode == null) {
            console.timeEnd("EXECUTION TIME");
            console.log("No valid nodes left to explore");
            console.log("FAILURE!");
            break;
        }

        if (currentNode.getId() == goal) {       // Goal is reached, reconstruct the path
            console.log("FINISHED");
            // console.log("CURRENT NODE: ", currentNode);
            finalPath = reconstructPath(cameFrom, currentNode);

            console.timeEnd("EXECUTION TIME");

            await displayFinalPath(finalPath, 15);

            break;
        }

        closedList.push(currentNode.getId());       // Mark current node as visited
        openList = openList.filter(nodeId =>         // Remove current node from open list
            !(nodeId == currentNode.getId())
        );


        // Explore neighbors of the current node
        let currentNodeNeighbors = getNeighbors(currentNode, nodes, ROWS, COLS, offsets, CONSIDER_DIAGONALS);
        await displayNeighbors(currentNodeNeighbors, 20);
        
        currentNodeNeighbors.forEach(neighbor => {

            // If neighbor is not an obstacle or is in closed list go on
            if (!(neighbor.getIsObstacle() || closedList.includes(neighbor.getId()))) {

                let tentativeG = currentNode.getGScore() + 1;       // Potential cost of reaching neighbor node through current node
            
                if (tentativeG < neighbor.getGScore()) {    // If neighbor is not in open_list or a better path is found
                    cameFrom.set(neighbor.getId(), currentNode);        
                    neighbor.setGScore(tentativeG);
                    neighbor.setFScore(neighbor.getGScore() + computeHValue(neighbor, nodes[goal], DISTANCE_FUNCTION));
                
                    // Check if neighbor is already in open list
                    if (!openList.includes(neighbor.getId())) {
                        openList.push(neighbor.getId());        // Add neighbor to open list
                    }
                }
            }
        });

        // Check if no path exists from start to goal node
        if (openList.length == 0 && currentNode.getId() != goal) {
            console.log("Goal is unreachable in this configuration.");
            console.timeEnd("EXECUTION TIME");
            await displayUnreachable(closedList, 5);
            return;
        }

        iterCounter++;
    }
});

async function displayUnreachable(closedList, ms) {
    for (const node of closedList) {
        let divElement = document.getElementById('cell_' + node);
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
    for (const node of path) {
        let divElement = document.getElementById('cell_' + node.getId());
        divElement.classList.add('final-path-cell');
        await delay(ms);           // Wait for 200 ms before coloring the next cell
    }
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function getNeighbors(node, nodes, rows, cols, offsets, considerDiagonals) {
    let neighbors = [];

    const { mainOffsets, diagonalOffsets } = offsets;

    // Determine the type of node and corresponding offsets
    let nodeType;
    if (node.isCentralNode(rows, cols)) nodeType = 'central';
    else if (node.isTopRowNode()) nodeType = 'topRow';
    else if (node.isBottomRowNode(rows)) nodeType = 'bottomRow';
    else if (node.isLeftColumnNode()) nodeType = 'leftColumn';
    else if (node.isRightColumnNode(cols)) nodeType = 'rightColumn';
    else if (node.isTopLeftCornerNode()) nodeType = 'topLeftCorner';
    else if (node.isTopRightCornerNode(cols)) nodeType = 'topRightCorner';
    else if (node.isBottomLeftCornerNode(rows)) nodeType = 'bottomLeftCorner';
    else if (node.isBottomRightCornerNode(rows, cols)) nodeType = 'bottomRightCorner';

    // Use the offsets for the identified node type
    if (nodeType) {
        mainOffsets[nodeType].forEach(offset => {
            const x = node.getX() + offset[0];
            const y = node.getY() + offset[1];
            const neighbor = getNodeFromCoordinates(x, y, nodes);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        });

        if (considerDiagonals) {            // Get diagonal neighbors if enabled
            diagonalOffsets[nodeType].forEach(offset => {
                const x = node.getX() + offset[0];
                const y = node.getY() + offset[1];
                const neighbor = getNodeFromCoordinates(x, y, nodes);
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


function getNodeFromCoordinates(x, y, nodes) {
    return nodes.find(node => node.getX() === x && node.getY() === y);
}


function reconstructPath(cameFrom, currentNode) {
    finalPath = [];
    finalPath.push(currentNode);

    // While the start node isn't reached
    while (cameFrom.has(currentNode.getId())) {             // Structural equality
        currentNode = cameFrom.get(currentNode.getId());        // Move to the parent from the current node
        
        finalPath.unshift(currentNode);     // Add node to the start of the path 
    }

    console.log("FINAL PATH: ", finalPath);

    return finalPath;
}


function getLowestFScoreNode(nodes, openList) {
    let currFScore = Infinity;
    let lowestFScoreNode = null;

    openList.forEach(nodeId => {
        let node = nodes[nodeId];
        if (node.getFScore() < currFScore) {
            currFScore = node.getFScore();
            lowestFScoreNode = node;
        }
    });

    return lowestFScoreNode;
}

function computeHValue(currNode, goalNode, distanceFunction) {
    switch (distanceFunction) {
        case 'Manhattan':
            return (Math.abs(goalNode.x - currNode.x) + Math.abs(goalNode.y - currNode.y));
        case 'Euclidean':
            return Math.sqrt(Math.pow(goalNode.x - currNode.x, 2) + Math.pow(goalNode.y - currNode.y, 2));
        case 'Chebyshev':
            return Math.max(Math.abs(goalNode.x - currNode.x), Math.abs(goalNode.y - currNode.y));
    }
}


function createGrid(rows, cols) {
    let counter = 0;

    let nodes = [];

    let gridDiv = document.getElementById('grid');
    for (let i = 0; i < rows; i++) {
        let newRow = document.createElement('div');
        newRow.setAttribute('class', 'row');
        for (let j = 0; j < cols; j++) {
            let newNode = document.createElement('div');
            newNode.setAttribute('class', 'cell');
            newNode.setAttribute('id', 'cell_' + counter);
            // newNode.textContent = i + ',' + j;
            // newNode.textContent = counter;
            newRow.appendChild(newNode);

            nodes.push(new Node(counter, i, j, false));

            counter++;
        }
        gridDiv.appendChild(newRow);
    }

    return nodes;
}

function setupObstacles(nodes, howMany, gridDimension) {
    let obstaclesId = new Array();

    while (obstaclesId.length < howMany) {
        let rand = Math.floor(Math.random() * (gridDimension - 2)) + 1;
        if (!obstaclesId.includes(rand)) {
            obstaclesId.push(rand);

            nodes[rand].setIsObstacle(true);

            let extractedObstacle = document.getElementById('cell_' + rand);
            extractedObstacle.classList.add('obstacle-cell');
        }
    }
}
