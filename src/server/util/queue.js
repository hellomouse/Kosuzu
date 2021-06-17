/* Download queue */

const EventEmitter = require('events');
const config = require('../../../config.js');

/**
 * Abstract download queue implementation,
 * in case an extension wishes to extend functionality
 * @author Bowserinator
 */
class AbstractQueue {
    /** Construct AbstractQueue */
    constructor() {
        this.emitter = new EventEmitter();
        this.size = 0;
    }

    /**
     * Add item to the queue. Does nothing in this
     * class, should be overriden. super.add(...) will
     * emit the add event with the item
     * @param {*} item Item to add to queue
     */
    add(item) {
        this.emitter.emit('add', item);
        this.size++;
    }

    /**
     * Remove item from the queue. super.remove(...)
     * should not be called if the item does not exist
     * in the queue. Should cancel the item
     * @param {*} item Item to remove
     */
    remove(item) {
        this.emitter.emit('remove', item);
        this.size--;
    }

    /**
     * Clear all items with given priority
     * Should cancel() removed items
     * @param {number} priority Priority
     */
    clearByPriority(priority) {
        this.emitter.emit('priority_remove', priority);
    }

    /**
     * Pop the first item from the queue and
     * returns it. Does not cancel() the item
     */
    pop() {
        throw new Error('pop() not yet implemented, please override the method from AbstractQueue');
    }

    /**
     * Peek at the nth element
     * @param {number} i Index of element to peek
     */
    get(i) {
        throw new Error('get(i) not yet implemented, please override the method from AbstractQueue');
    }

    /** Peek first element in the queue */
    peek() {
        throw new Error('peek() not yet implemented, please override the method from AbstractQueue');
    }

    /**
     * Return the size of the queue
     * @return {number} size of the queue
     */
    size() {
        return this.size;
    }

    /**
     * Is the queue empty?
     * @return {boolean} Is the queue empty
     */
    isEmpty() {
        return this.size === 0;
    }
}

/**
 * Simple download queue implementation
 * Queues are utilized per website
 *
 * Not suitable for very large queues (> 100k items)
 * (Although if your request queue is that large something's probably wrong)
 * @author Bowserinator
 */
class Queue extends AbstractQueue {
    constructor() {
        super();
        this._queue = {};
    }

    add(item) {
        if (this.size + 1 >= config.max_queue_size_per_extension)
            return;

        super.add(item);
        let priority = item.priority || 0;

        this._queue[priority] = this._queue[priority] || [];
        this._queue[priority].push(item);
    }

    remove(item) {
        super.remove(item);
        item.cancel();
        this._queue[item.priority || 0].remove(item);
    }

    get(i) {
        if (i < 0 || i >= this.size)
            return null;
        let j = 0;

        for (let key of (Object.keys(this._queue).sort((a, b) => a - b))) {
            j += this._queue[key].length;
            if (j > i)
                return this._queue[key][i - (j - this._queue[key].length)];
        }
        return null;
    }

    peek() {
        for (let key of (Object.keys(this._queue).sort((a, b) => a - b)))
            if (this._queue[key].length > 0)
                return this._queue[key][0];
        return null;
    }

    pop() {
        for (let key of (Object.keys(this._queue).sort((a, b) => a - b)))
            if (this._queue[key].length > 0) {
                this.size--;
                return this._queue[key].shift();
            }
        return null;
    }

    clearByPriority(priority) {
        if (!this._queue[priority])
            return;
        super.clearByPriority(priority);
        this._queue[priority].forEach(x => x.cancel());
        this._queue[priority] = [];
    }
}

module.exports = { AbstractQueue, Queue };
