const { get } = require("node:https")
require('dotenv').config();

function fetch(url) {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            let buff = Buffer.alloc(0);
            res.on("data", chunk => buff = Buffer.concat([buff, Buffer.from(chunk)]))
            res.on("error", reject)
            res.on("end", () => resolve(buff))
        }).on("error", e => {
            if (e.code != 'ETIMEDOUT') reject(e)
            fetch(url).then(resolve).catch(reject)
        })
    })
}

setInterval(() => {
    fetch(`${process.env.BASE_URL}/getUpdates`).then(buff => {
        console.log(JSON.parse(buff.toString()));
    }).catch(console.log)
}, 2000);