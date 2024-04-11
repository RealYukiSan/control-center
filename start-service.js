#!/usr/bin/env node

const { spawn } = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const { get } = require('node:https');
require('dotenv').config();

let last_update = '';
async function handler() {
	const param = `timeout=150&offset=${last_update}`;
	fetch(`${process.env.BASE_URL}/getUpdates?${param}`)
		.then((response) => {
			response = JSON.parse(response.toString());
			if (response.ok && response.result.length) {
				const update = response.result[response.result.length - 1];
				if (update.message.chat.id != process.env.OWNER_ID) return;
				last_update = update.update_id + 1;
				const last_tracked = fs.readFileSync('./track_message');
				if (last_tracked.toString() < last_update) {
					fs.writeFileSync(
						'./track_message',
						last_update.toString(),
						{ flag: 'w' }
					);
					const prompt = update.message.text
						.replace(/\s{2,}/g, ' ')
						.split(' ');
					if (prompt.length > 1) {
						let output = '';
						let error = '';
						const param = `chat_id=${process.env.OWNER_ID}&text=`;
						switch (prompt[0]) {
							case 'exec':
								const exec = spawn('sh', [
									'-c',
									prompt.splice(1).join(' '),
								]);
								exec.stdout.on(
									'data',
									(chunk) => (output += chunk)
								);
								exec.stderr.on(
									'data',
									(chunk) => (error += chunk)
								);
								exec.stderr.on('end', () => {
									if (error) {
										error = encodeURIComponent(
											escapeSpecialChar(error)
										);
										fetch(
											`${process.env.BASE_URL}/sendMessage?${param + error}`
										).catch(console.log);
									}
								});
								exec.stdout.on('end', () => {
									if (output) {
										const text = encodeURIComponent(
											escapeSpecialChar(output)
										);
										fetch(
											`${process.env.BASE_URL}/sendMessage?${param + text}`
										).catch(console.log);
									}
								});
								break;
							case 'sudo':
								const sudo = spawn('sh', [
									'-c',
									`echo ${process.env.SUDO_PW} | sudo -S ${prompt.splice(1).join(' ')}`,
								]);
								sudo.stdout.on(
									'data',
									(chunk) => (output += chunk)
								);
								sudo.stderr.on(
									'data',
									(chunk) => (error += chunk)
								);
								sudo.stderr.on('end', () => {
									if (error) {
										error = encodeURIComponent(
											escapeSpecialChar(error)
										);
										fetch(
											`${process.env.BASE_URL}/sendMessage?${param + error}`
										).catch(console.log);
									}
								});
								sudo.stdout.on('end', () => {
									if (output) {
										const text = encodeURIComponent(
											escapeSpecialChar(output)
										);
										fetch(
											`${process.env.BASE_URL}/sendMessage?${param + text}`
										).catch(console.log);
									}
								});
								break;
							default:
								break;
						}
					}
				}
			}
		})
		.catch(console.log);
}

setInterval(() => {
	handler();
}, 1000 * process.env.HANDLER_TIMEOUT);

if (process.argv.includes('--ssh')) {
	const ssh = spawn('gwrok', [
		'client',
		'--target-addr',
		'127.0.0.1',
		'--target-port',
		process.env.SSH_PORT,
		'--server-addr',
		process.env.GWROK_IP,
		'--server-port',
		'9999',
	]);

	ssh.stdout.on('data', (data) => {
		if (data.toString().startsWith('Excellent')) {
			const port = data.toString().split(':')[2];
			const ephPort = port.slice(0, port.indexOf('\n'));
			const text = encodeURIComponent(
				`*SSH*\nIP \`${process.env.GWROK_IP.replace(/\./g, '\\.')}\`\nPort \`${ephPort}\``
			);
			const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
			fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(
				console.log
			);

			const intervalId = setInterval(
				() => keepAlive(ephPort, intervalId),
				1000 * process.env.KEEPALIVE_TIMEOUT
			);
		}
	});
}

if (process.argv.includes('--http')) {
	const http = spawn('gwrok', [
		'client',
		'--target-addr',
		'127.0.0.1',
		'--target-port',
		process.env.HTTP_PORT,
		'--server-addr',
		process.env.GWROK_IP,
		'--server-port',
		'9999',
	]);

	http.stdout.on('data', (data) => {
		if (data.toString().startsWith('Excellent')) {
			const port = data.toString().split(':')[2];
			const ephPort = port.slice(0, port.indexOf('\n'));
			const text = encodeURIComponent(
				`*HTTP*\nIP \`${process.env.GWROK_IP.replace(/\./g, '\\.')}\`\nPort \`${ephPort}\``
			);
			const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
			fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(
				console.log
			);

			const intervalId = setInterval(
				() => keepAlive(ephPort, intervalId),
				1000 * process.env.KEEPALIVE_TIMEOUT
			);
		}
	});
}

function keepAlive(port, intervalId) {
	const socket = new net.Socket();
	socket.setTimeout(1000);
	socket.connect(port, process.env.GWROK_IP, () => socket.destroy());
	socket.on('timeout', () => {
		clearInterval(intervalId);
		const error = encodeURIComponent(
			'*Alert*: something went wrong\\!\nPlease check your mini\\-serper \\>///<'
		);
		const param = `chat_id=5599651385&parse_mode=MarkdownV2&text=${error}`;
		fetch(`${process.env.BASE_URL}/sendMessage?${param}`).catch(
			console.log
		);
	});
}

function escapeSpecialChar(text) {
	// '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'
	const regex = /[\_\*\[\]\~\`\(\)\>\#\+\-\=\{\}\|\!\.]/g;
	return text.replace(regex, '\\$&');
}

function fetch(url) {
	return new Promise((resolve, reject) => {
		get(url, (res) => {
			let buff = Buffer.alloc(0);
			res.on(
				'data',
				(chunk) => (buff = Buffer.concat([buff, Buffer.from(chunk)]))
			);
			res.on('error', reject);
			res.on('end', () => resolve(buff));
		}).on('error', (e) => {
			if (e.code != 'ETIMEDOUT') reject(e);
			fetch(url).then(resolve).catch(reject);
		});
	});
}
