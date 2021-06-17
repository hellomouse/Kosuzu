
const SearchData = require('./src/server/actions/act-search.js');

const DownloadData = require('./src/server/actions/act-download.js');


const data = {
    'extension': require('./src/server/extension.js'),
    'download': require('./src/server/util/download.js'),
    'queue': require('./src/server/util/queue.js')
};

/**
 *
 */
async function f() {
    const c = data.extension.loadExtension('520manhuawang');
    const d = new SearchData([], { name: '此花亭奇谭' });

    // c.queue.add(new DownloadData({
    //     chapter: 56,
    //     id: 'https://www.kokomh.com/baihe/cihuatingqitan/'
    // }));
    // c.queue.add(d);

    while (c.queue.size || c.requestQueue.size)
        await c.tick();

    // let r = await c.search(d);
    // let r = await c.getMangaInfo('https://www.kokomh.com/qihuan/cihuazuotan/');
    // console.log(r);
}

f();
