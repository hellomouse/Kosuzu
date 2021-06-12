

/*
required:
- update url? :shrug:

- icon file in folder

warnings for suspicious extensions
- check for weird metadata / conflicting ids
- code etc
*/

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
     *                              id: Unique id for the extension
     *                              name: Display name for the extension
     *                          Optional keys:
     *                              description: (default: 'No description provided')
     *                              author: (default: 'Anonymous')
     *                              version: (default: 'Unknown version')
     *                              language: (Default: 'en') language the extension is directed towards, use '*' if
     *                                        results are mostly multilingual
     *                              tags: (Default: []), special tags for the extension, use TAGS.[tag name]
     * @param {AbstractQueue} queue Queue for actions
     */
    constructor(metadata, queue) {
        this.metadata = this._verifyMetadata(metadata);
        this.queue = queue;
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
    search(searchParams) {
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
     *    chapter_count: 10,
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
    getMangaInfo(id) {
        throw new Error('getMangaInfo(id) is not yet implemented, please override');
    }

    /**
     * Return an array of urls to all the images in the chapter
     * @param {string} id Id of the chapter, format depends on implementation in getMangaInfo
     */
    getChapterImages(id) {
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

module.exports = { AbstractExtension, TAGS };
