/**
 * arrayUtils.js
 * 
 * Performance-optimized array utilities for game loops.
 * Avoids creating new arrays in hot paths by using in-place operations.
 */

/**
 * In-place array compaction using swap-and-pop pattern.
 * Removes elements that don't satisfy the predicate WITHOUT creating a new array.
 * 
 * @param {Array} arr - Array to compact in-place
 * @param {Function} predicate - Function that returns true for elements to KEEP
 * @param {Function} [onRemove] - Optional callback when element is removed (for pooling)
 * @returns {number} Number of elements removed
 * 
 * @example
 * // Remove dead bullets
 * compactArray(gameState.bullets, bullet => bullet.life > 0);
 * 
 * // With pool release
 * compactArray(gameState.particles, p => p.life > 0, p => particlePool.release(p));
 */
export function compactArray(arr, predicate, onRemove = null) {
    let writeIdx = 0;
    let removed = 0;
    const len = arr.length;
    
    for (let i = 0; i < len; i++) {
        const item = arr[i];
        if (predicate(item)) {
            // Keep this item
            if (writeIdx !== i) {
                arr[writeIdx] = item;
            }
            writeIdx++;
        } else {
            // Remove this item
            removed++;
            if (onRemove) {
                onRemove(item);
            }
        }
    }
    
    // Truncate array in-place
    arr.length = writeIdx;
    return removed;
}

/**
 * In-place array compaction with update step.
 * Combines update and removal in a single pass for better cache locality.
 * 
 * @param {Array} arr - Array to process
 * @param {Function} updateFn - Function to call on each element, returns false to remove
 * @param {Function} [onRemove] - Optional callback when element is removed
 * @returns {number} Number of elements removed
 * 
 * @example
 * // Update and remove in one pass
 * compactArrayWithUpdate(gameState.bullets, bullet => {
 *     bullet.update();
 *     return bullet.life > 0; // Return true to keep
 * });
 */
export function compactArrayWithUpdate(arr, updateFn, onRemove = null) {
    let writeIdx = 0;
    let removed = 0;
    const len = arr.length;
    
    for (let i = 0; i < len; i++) {
        const item = arr[i];
        const keep = updateFn(item);
        
        if (keep) {
            if (writeIdx !== i) {
                arr[writeIdx] = item;
            }
            writeIdx++;
        } else {
            removed++;
            if (onRemove) {
                onRemove(item);
            }
        }
    }
    
    arr.length = writeIdx;
    return removed;
}

/**
 * Fast array clear that allows GC to collect items.
 * More efficient than arr = [] when the array reference must be preserved.
 * 
 * @param {Array} arr - Array to clear
 */
export function clearArray(arr) {
    arr.length = 0;
}

/**
 * Batch remove items from array by indices (must be sorted ascending).
 * More efficient than multiple splices.
 * 
 * @param {Array} arr - Array to modify
 * @param {number[]} indices - Sorted array of indices to remove
 */
export function removeByIndices(arr, indices) {
    if (indices.length === 0) return;
    
    let writeIdx = 0;
    let removeIdx = 0;
    const len = arr.length;
    
    for (let i = 0; i < len; i++) {
        if (removeIdx < indices.length && i === indices[removeIdx]) {
            removeIdx++;
        } else {
            if (writeIdx !== i) {
                arr[writeIdx] = arr[i];
            }
            writeIdx++;
        }
    }
    
    arr.length = writeIdx;
}

