export function createShape(path) {
    return new Shape(path.map((p) => new Vector2(p[0], p[1])));
}
