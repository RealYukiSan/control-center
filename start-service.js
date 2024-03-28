#!/usr/bin/node

const { spawn } = require('node:child_process');
const net = require("node:net");
const fs = require("node:fs");
require('dotenv').config();

const http = spawn('gwrok', ['client', '--target-addr', '127.0.0.1', '--target-port', process.env.HTTP_PORT, '--server-addr', process.env.GWROK_IP, '--server-port', '9999']);
const ssh = spawn('gwrok', ['client', '--target-addr', '127.0.0.1', '--target-port', process.env.SSH_PORT, '--server-addr', process.env.GWROK_IP, '--server-port', '9999']);

let last_update = '';
async function handler() {
  try {
    const param = `timeout=150&offset=${last_update}`;
    const response = await fetch(`${process.env.BASE_URL}/getUpdates?${param}`, { keepalive: true }).then(res => res.json())

    if (response.ok && response.result.length) {
      const update = response.result[response.result.length - 1];
      if (update.message.chat.id != process.env.OWNER_ID) return
      last_update = update.update_id + 1;
      const last_tracked = fs.readFileSync("./track_message");
      if (last_tracked.toString() < last_update) {
        fs.writeFileSync('./track_message', last_update.toString(), { flag: 'w' });
        const prompt = update.message.text.replace(/\s{2,}/g, ' ').split(" ");
        if (prompt[0].startsWith('exec') && prompt.length > 1) {
          const child = spawn(prompt[1], prompt.splice(2));
          let output = '';
          child.stdout.on('data', (chunk) => output += chunk);
          child.stdout.on('end', () => {
            const text = encodeURIComponent(escapeSpecialChar(output));
            const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
            fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(console.log).then(res => res.json()).then(console.log);				
          });
        }
      }
    }
  } catch(err) {
    console.log(err)
  }
}

setInterval(() => {
  handler();
}, 1000 * process.env.HANDLER_TIMEOUT);

ssh.stdout.on('data', (data) => {
if (data.toString().startsWith('Excellent')) {
const port = data.toString().split(':')[2];
const ephPort = port.slice(0, port.indexOf('\n'));
const text = encodeURIComponent(`*SSH*\nIP \`${process.env.GWROK_IP.replace(/\./g, '\\.')}\`\nPort \`${ephPort}\``);
const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(console.log)

const intervalId = setInterval(() => keepAlive(ephPort, intervalId), 1000 * process.env.KEEPALIVE_TIMEOUT);
}
});

http.stdout.on('data', (data) => {
if (data.toString().startsWith('Excellent')) {
const port = data.toString().split(':')[2];
const ephPort = port.slice(0, port.indexOf('\n'));
const text = encodeURIComponent(`*HTTP*\nIP \`${process.env.GWROK_IP.replace(/\./g, '\\.')}\`\nPort \`${ephPort}\``);
const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(console.log)

const intervalId = setInterval(() => keepAlive(ephPort, intervalId), 1000 * process.env.KEEPALIVE_TIMEOUT);
}
});

function keepAlive(port, intervalId) {
const socket = new net.Socket();
socket.setTimeout(1000);
socket.connect(port, process.env.GWROK_IP, () => socket.destroy())
socket.on("timeout", () => {
clearInterval(intervalId)
const error = encodeURIComponent('*Alert*: something went wrong\\!\nPlease check your mini\\-serper \\>///<');
const param = `chat_id=5599651385&parse_mode=MarkdownV2&text=${error}`;
fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(console.log)
});
}

function escapeSpecialChar(text) {
  const regex = /[_*\[\]~`()>\#\-={}|!.]/g;
  return text.replace(regex, '\\$&');
}
