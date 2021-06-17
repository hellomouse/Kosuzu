/**
 * A request parameter (for search, download, etc...)
 * that can be cancelled
 * @author Bowserinator
 */
class AbstractAction {
    constructor(priority) {
        this.cancelled = false;
        this.priority = priority;
    }

    /** Cancel the request */
    cancel() {
        this.cancelled = true;
    }

    /**
     * Convert to request action data
     * @return {Array} array of objects for each request type
     */
    toRequest() {
        throw new Error('toRequest() not implemented, please override');
    }
}

module.exports = AbstractAction;
