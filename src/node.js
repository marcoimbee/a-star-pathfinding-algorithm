class Node {
    constructor(id, x, y, isObstacle) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.isObstacle = isObstacle;
        this.gScore = Infinity;
        this.fScore = Infinity;
    }

    getId() {
        return this.id;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getIsObstacle() {
        return this.isObstacle;
    }

    setIsObstacle(isObstacle) {
        this.isObstacle = isObstacle;
    }

    setGScore(val) {
        this.gScore = val;
    }

    getGScore() {
        return this.gScore;
    }

    setFScore(val) {
        this.fScore = val;
    }

    getFScore() {
        return this.fScore;
    }

    isTopRowNode() {
        if (this.x == 0)
            return true;

        return false;
    }

    isBottomRowNode(rows) {
        if (this.x == rows - 1)
            return true;

        return false;
    }

    isTopLeftCornerNode() {
        if (this.x == 0 && this.y == 0)
            return true;

        return false;
    }

    isTopRightCornerNode(cols) {
        if (this.x == 0 && this.y == cols - 1)
            return true;

        return false;
    }

    isBottomLeftCornerNode(rows) {
        if (this.x == rows - 1 && this.y == 0)
            return true;

        return false;
    }

    isBottomRightCornerNode(rows, cols) {
        if (this.x == rows - 1 && this.y == cols - 1)
            return true;

        return false;
    }

    isLeftColumnNode() {
        if (this.y == 0)
            return true;

        return false;
    }

    isRightColumnNode(cols) {
        if (this.y == cols - 1)
            return true;

        return false;
    }

    isCentralNode(rows, cols) {
        if (
            !this.isTopRowNode() &&
            !this.isBottomRowNode(rows) &&
            !this.isLeftColumnNode() &&
            !this.isRightColumnNode(cols) &&
            !this.isTopLeftCornerNode() &&
            !this.isBottomLeftCornerNode(rows) &&
            !this.isTopRightCornerNode(cols) &&
            !this.isBottomRightCornerNode(rows, cols)
        )
            return true;

        return false;
    }

    toString() {
        return "ID: " + this.id + ", (x, y) = (" + this.x + ", " + this.y + ")";
    }
}