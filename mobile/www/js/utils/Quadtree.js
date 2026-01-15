export class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // { x, y, width, height }
        this.capacity = capacity; // Max objects per bucket
        this.objects = [];
        this.divided = false;
    }

    subdivide() {
        const { x, y, width, height } = this.boundary;
        const w = width / 2;
        const h = height / 2;

        this.northeast = new Quadtree({ x: x + w, y: y, width: w, height: h }, this.capacity);
        this.northwest = new Quadtree({ x: x, y: y, width: w, height: h }, this.capacity);
        this.southeast = new Quadtree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);
        this.southwest = new Quadtree({ x: x, y: y + h, width: w, height: h }, this.capacity);

        this.divided = true;
    }

    insert(obj) {
        // obj must have { x, y, radius (or width/height) }
        if (!this.contains(this.boundary, obj)) {
            return false;
        }

        if (this.objects.length < this.capacity) {
            this.objects.push(obj);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northeast.insert(obj)) return true;
        if (this.northwest.insert(obj)) return true;
        if (this.southeast.insert(obj)) return true;
        if (this.southwest.insert(obj)) return true;

        // If it doesn't fit in children (e.g. on boundary), keep it here? 
        // Simple implementation: pushing to this.objects anyway if children reject 
        // (though they shouldn't if boundary checks are correct, unless it overlaps lines)
        // For simple point/circle quadtrees, usually objects are points.
        // For spatial collision, we often insert into all overlapping quadrants.
        
        // Let's stick to a simple bucket approach where we might just add it to this node if it fails children
        this.objects.push(obj);
        return true;
    }

    // Helper to check if boundary contains object center
    contains(rect, obj) {
        return (obj.x >= rect.x &&
                obj.x < rect.x + rect.width &&
                obj.y >= rect.y &&
                obj.y < rect.y + rect.height);
    }

    query(range, found) {
        if (!found) found = [];
        
        if (!this.intersects(this.boundary, range)) {
            return found;
        }

        for (let p of this.objects) {
            if (this.intersectsObj(range, p)) {
                found.push(p);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }
    
    intersects(rect, range) {
        // Range is usually a circle or rect. Let's assume rect for query {x, y, width, height} or circle {x, y, radius}
        // Simple AABB intersection
        return !(range.x > rect.x + rect.width ||
                 range.x + range.width < rect.x ||
                 range.y > rect.y + rect.height ||
                 range.y + range.height < rect.y);
    }

    intersectsObj(range, obj) {
        // Simple AABB check for query
        // Ensure objects have x,y
        const x = obj.x;
        const y = obj.y;
        return (x >= range.x && x < range.x + range.width &&
                y >= range.y && y < range.y + range.height);
    }

    clear() {
        this.objects = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}

