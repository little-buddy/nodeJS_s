const {a} = require('./one')
console.log(require.cache)
Object.keys(require.cache).forEach(x=>{console.log(require.cache[x].children)})