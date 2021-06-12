/**
 * A request parameter (for search, download, etc...)
 * that can be cancelled
 * @author Bowserinator
 */
class AbstractRequestParameter {
    constructor(priority) {
        this.cancelled = false;
        this.priority = priority;
    }

    /** Cancel the request */
    cancel() {
        this.cancelled = true;
    }
}

module.exports = AbstractRequestParameter;
