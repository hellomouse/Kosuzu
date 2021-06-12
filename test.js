const ext = require('./src/extensions/520manhuawang/index.js');
const SearchData = require('./src/server/params/req-search.js');

const data = {
    'AbstractExtension': require('./src/server/extension.js').AbstractExtension,
    'download': require('./src/server/util/download.js')
};

/**
 *
 */
async function f() {
    const c = new (ext(data))();
    let r = await c.search(new SearchData([], { name: '此花亭奇谭' }));
    // let r = await c.getMangaInfo('https://www.kokomh.com/qihuan/cihuazuotan/');
    console.log(r);
}

f();
