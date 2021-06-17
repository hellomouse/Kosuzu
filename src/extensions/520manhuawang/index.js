module.exports = data => {
    const metadata = {
        id: '520-manhuawang',
        name: '520 Manhua Wang',
        description:
`Chinese manhua & chinese manga translations from https://www.kokomh.com/
This site offers limited search functionality and may be rate-limited`,
        author: 'Bowserinator',
        version: '1.0.0',
        language: 'zh',
        tags: [
            data.extension.TAGS.PUPPETEER,
            data.extension.TAGS.ANTI_BOT,
            data.extension.TAGS.LIMITED_SEARCH
        ]
    };

    class Extension extends data.extension.AbstractExtension {
        constructor() {
            super(metadata, new data.queue.Queue(), new data.queue.Queue());
        }

        search(searchParams) {
            const url = `https://www.kokomh.com/statics/search.aspx?key=${encodeURIComponent(searchParams.name)}`;
            return data.download.pageEval(url, () => {
                const searchList = document.getElementsByClassName('mh-search-list');
                if (searchList.size === 0)
                    return [];

                const results = [...searchList[0].getElementsByTagName('li')];
                return results.map(item => {
                    const date = item.getElementsByClassName('mh-up-time')[0].innerText.split('：')[1].split('-');
                    const h4 = item.getElementsByTagName('h4')[0];

                    return {
                        title: h4.innerText,
                        author: null,
                        cover_image: item.getElementsByTagName('img')[0].src,
                        id: {
                            url: h4.getElementsByTagName('a')[0].href,
                            genres: [...item.getElementsByClassName('mh-works-tags')[0].getElementsByTagName('a')].map(x => x.innerText),
                            last_updated: {
                                year: date[0],
                                month: date[1],
                                day: date[2]
                            }
                        }
                    };
                });
            });
        }

        getMangaInfo(url) {
            return data.download.pageEval(url,
                () => {
                    const worksInfo = document.getElementsByClassName('works-info-tc');
                    const chapters = [...document.getElementById('mh-chapter-list-ol-0').getElementsByTagName('li')]
                        .map(li => {
                            return {
                                name: li.innerText,
                                id: li.getElementsByTagName('a')[0].href,
                                language: 'zh', // This is hardcoded, but it seems all the manhua is zh
                                date: null
                            };
                        });
                    chapters.reverse();

                    return {
                        url: window.location.href,
                        title: document.getElementsByClassName('mh-date-info-name')[0].innerText,
                        author: worksInfo[0].innerText.split('： ')[1],
                        cover_image: document.getElementsByClassName('mh-date-bgpic')[0].getElementsByTagName('img')[0].src,
                        last_updated: null, // Year not obtainable from manhua page
                        genres: [], // Not obtainable from the manhua page, only in search
                        description: document.getElementById('workint').innerText,
                        chapter_count: chapters.length,
                        ongoing: worksInfo[1].innerText.includes('连载中'), // 连载中 / 完结 (serializing / completed)
                        chapters: chapters
                    };
                },
                {
                    delay: 0,
                    autoscroll: false,
                    blockImages: true,
                    blockCSS: true
                });
        }

        getChapterImages(url) {
            // The qTcms_S_m_murl contains all the image urls split by $qingtian$
            // To avoid the split key possibly changing we split by $ and just take strings
            // that start with http

            return data.download.pageEval(url,
                () => qTcms_S_m_murl.split('$').filter(x => x.startsWith('http')).map((x, i) => {
                    return {
                        page: i + 1,
                        url: x
                    };
                }),
                {
                    delay: 0,
                    autoscroll: false,
                    blockImages: true,
                    blockCSS: true
                });
        }
    }

    return Extension;
};
