/* Download options */

const util = require('../util/util.js');
const AbstractAction = require('./action.js');
const ActionConstants = require('./constants.js');

const _allowedKeys = ['downloadDir', 'chapter', 'convert', 'keepPostConversion', 'quality', 'id'];
const _allowedConversion = ['pdf', 'cbz', 'none'];

/**
 * Options for downloading
 * @author Bowserinator
 */
class DownloadOptions extends AbstractAction {
    /**
     * Construct a download options instance. Data keys:
     *      downloadDir: '/path/to/download',
     *      chapter: what chapter to download (index, chapter 1 = 0)
     *      convert: 'pdf|cbz|none' [default is 'none']
     *      keepPostConversion: false,
     *      quality: [unused for now],
     *      id: manga id (extension dependent)
     *
     * @param {object} data Data to download
     */
    constructor(data) {
        super(2);

        for (let key of Object.keys(data))
            util.assert(_allowedKeys.includes(key), `Key '${key}' is not allowed in data, did you misspell the key?`);


        // Defaults
        data.convert = data.convert || 'none';

        // Value checks
        util.assert(_allowedConversion.includes(data.convert), `data.convert must be of ${_allowedConversion.join('|')}, got '${data.convert}'`);

        for (let key of Object.keys(data))
            this[key] = data[key];
    }

    toRequest() {
        return [{
            type: ActionConstants.START_IMG_DOWNLOAD,
            chapter: this.chapter,
            id: this.id,
            priority: 2
        }];
    }
}

module.exports = DownloadOptions;
