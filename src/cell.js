class Cell {
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

    isTopRowCell() {
        if (this.x == 0)
            return true;

        return false;
    }

    isBottomRowCell(rows) {
        if (this.x == rows - 1)
            return true;

        return false;
    }

    isTopLeftCornerCell() {
        if (this.x == 0 && this.y == 0)
            return true;

        return false;
    }

    isTopRightCornerCell(cols) {
        if (this.x == 0 && this.y == cols - 1)
            return true;

        return false;
    }

    isBottomLeftCornerCell(rows) {
        if (this.x == rows - 1 && this.y == 0)
            return true;

        return false;
    }

    isBottomRightCornerCell(rows, cols) {
        if (this.x == rows - 1 && this.y == cols - 1)
            return true;

        return false;
    }

    isLeftColumnCell() {
        if (this.y == 0)
            return true;

        return false;
    }

    isRightColumnCell(cols) {
        if (this.y == cols - 1)
            return true;

        return false;
    }

    isCentralCell(rows, cols) {
        if (
            !this.isTopRowCell() &&
            !this.isBottomRowCell(rows) &&
            !this.isLeftColumnCell() &&
            !this.isRightColumnCell(cols) &&
            !this.isTopLeftCornerCell() &&
            !this.isBottomLeftCornerCell(rows) &&
            !this.isTopRightCornerCell(cols) &&
            !this.isBottomRightCornerCell(rows, cols)
        )
            return true;

        return false;
    }

    toString() {
        return "ID: " + this.id + ", (x, y) = (" + this.x + ", " + this.y + ")";
    }
}