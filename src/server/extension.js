

/*
required:
- update url? :shrug:

- icon file in folder

warnings for suspicious extensions
- check for weird metadata / conflicting ids
- code etc
*/

const path = require('path');
const fs = require('fs-extra');

const ActionConstants = require('./actions/constants.js');
const download = require('./util/download.js');

/* Hardcoded tags */
const TAGS = {
    PUPPETEER: 0, // Uses puppeteer internally
    ANTI_BOT: 1, // Endpoint employs anti-bot features / strong rate limiting
    LIMITED_SEARCH: 2 // Search functionality is severely limited by endpoint
};

/**
 * Abstract extension, all extensions must return
 * a new instance of this
 * @author Bowserinator
 */
class AbstractExtension {
    /**
     * Construct an abstract extension
     * @param {object} metadata metadata for the extension. Must contain the following keys:
     *                              id: Unique id for the extension, should match folder name in extensions
     *                              name: Display name for the extension
     *                          Optional keys:
     *                              description: (default: 'No description provided')
     *                              author: (default: 'Anonymous')
     *                              version: (default: 'Unknown version')
     *                              language: (Default: 'en') language the extension is directed towards, use '*' if
     *                                        results are mostly multilingual
     *                              tags: (Default: []), special tags for the extension, use TAGS.[tag name]
     * @param {AbstractQueue} queue Queue for actions
     * @param {AbstractQueue} requestQueue Queue for requests
     */
    constructor(metadata, queue, requestQueue) {
        this.metadata = this._verifyMetadata(metadata);
        this.queue = queue;
        this.requestQueue = requestQueue;

        this.metadataCache = {};
    }

    /**
     * Update request queue. If request queue is empty push to
     * request queue from action queue
     */
    async tick() {
        let nextRequest = this.requestQueue.pop();

        // No request action, pull from action queue
        if (!nextRequest) {
            let action = this.queue.pop();
            while (action && action.cancelled)
                action = this.queue.pop();
            if (!action)
                return;
            for (let req of action.toRequest())
                this.requestQueue.add(req);
        }
        // Process request
        else {
            console.log(nextRequest);
            // TODO: how to pass data out lol? Write to temp cache? have function to access data?
            // like search -> if no cache -> queue search action and await

            if (nextRequest.type === ActionConstants.SEARCH)
                this.search(nextRequest.data);
            else if (nextRequest.type === ActionConstants.START_IMG_DOWNLOAD) {
                // Generate metadata cache if needed
                if (!this.metadataCache[nextRequest.id])
                    this.metadataCache[nextRequest.id] = await this.getMangaInfo(nextRequest.id);

                // TODO: this loads 2 reqests at once, seperate

                let metadata = this.metadataCache[nextRequest.id];

                // TODO: check invalid id? & emit error
                if (nextRequest.chapter < 0 || nextRequest.chapter >= metadata.chapter_count)
                    return;

                let id = metadata.chapters[nextRequest.chapter].id;

                let imgUrls = await this.getChapterImages(id);

                // TODO higher pirority for image downloads
                for (let img of imgUrls)
                    this.requestQueue.add({
                        type: ActionConstants.DOWNLOAD_IMG,
                        data: img,
                        manga_id: nextRequest.id,
                        chapter: nextRequest.chapter,
                        priority: 1
                    });
            } else if (nextRequest.type === ActionConstants.DOWNLOAD_IMG) {
                const dir = `./${nextRequest.manga_id.replace(/[/\\?%*:|"<>]/g, '-')}/${nextRequest.chapter}/`;
                fs.ensureDirSync(dir);
                download.download(nextRequest.data.url, dir + `${nextRequest.data.page}.png`); // TODO: detect file ext?
            }
            // TODO: download img to folder
        }
    }

    /**
     * Perform a search and return the result
     * Return an array in this format:
     * [
     *    {
     *       title: 'string',
     *       author: 'string',
     *       cover_image: 'url.to.cover/image',
     *       id: ... any metadata that gets passed to getMangaInfo
     *    },
     *    ...
     * ]
     * @param {SearchData} searchParams Search parameters
     */
    async search(searchParams) {
        throw new Error('search(searchParams) is not yet implemented, please override');
    }

    /**
     * Get metadata info for a manga.
     * Return an object with the following keys:
     *    url: 'id or url or whatever for future downloading',
     *    title: 'string',
     *    author: 'string',
     *    cover_image: 'string url',
     *    last_updated: { year: ..., month: ..., day: ... },
     *    genres: [ 'string', 'string', ... ],
     *    description: 'string description',
     *    chapter_count: number of chapters,
     *    ongoing: true / false
     *    chapters: [
     *      {
     *          name: 'Chapter name',
     *          id: 'id, url or whatever for the chapter, passed to getChapterImages',
     *          language: 'language code of the chapter',
     *          date: { year: ..., month: ..., day: ... }
     *      },
     *      ...
     *    ]
     * @param {string} id ID for the manga
     */
    async getMangaInfo(id) {
        throw new Error('getMangaInfo(id) is not yet implemented, please override');
    }

    /**
     * Return an array of urls to all the images in the chapter
     * @param {string} id Id of the chapter, format depends on implementation in getMangaInfo
     */
    async getChapterImages(id) {
        throw new Error('getChapterImages(id) is not yet implemented, please override');
    }

    // TODO
    checkForUpdates() {
        // TODO
    }

    /**
     * Verifies metadata and replaces missing keys with defaults
     * @param {object} metadata metadata
     * @return {object} metadata with defaults
     */
    _verifyMetadata(metadata) {
        let newMetadata = {};

        // Mandatory fields
        if (!metadata.id)
            throw new Error('Extension metadata id is missing!');
        if (!metadata.name)
            throw new Error(`Extension (${metadata.id}) is missing a name!`);

        newMetadata.id = metadata.id + '';
        newMetadata.name = metadata.name + '';

        newMetadata.description = metadata.description + '' || 'No description provided';
        newMetadata.author = metadata.author + '' || 'Anonymous';
        newMetadata.version = metadata.version + '' || 'Unknown version';
        newMetadata.language = metadata.language + '' || 'en';
        newMetadata.tags = metadata.tags || [];

        return newMetadata;
    }
}

/**
 * Require() an extension and return instance
 * @param {string} extid Id of the extension, should match folder name in src/extensions
 * @param {boolean} reload Reload the extension (clear require cache)
 * @return {AbstractExtension} Extension object, or null if error
 */
function loadExtension(extid, reload = false) {
    try {
        const dir = path.join('../extensions/', extid);

        if (reload)
            delete require.cache[require.resolve(dir)];
        const ext = require(dir);
        const data = {
            extension: require('./extension.js'),
            download: require('./util/download.js'),
            queue: require('./util/queue.js')
        };

        return new (ext(data))();
    } catch (e) {
        return null;
    }
}

module.exports = { AbstractExtension, TAGS, loadExtension };
