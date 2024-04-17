#!/usr/bin/env node

const { spawn } = require('node:child_process');
const { get } = require('node:https');
const fs = require('node:fs');
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
						const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkDownV2&text=`;
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
								exec.once('exit', async () => {
									if (error) {
										if (error.length > 4096) {
											error = chunkSubstr(error, 4096);
											for (const key in error) {
												let item = error[key];
												item = encodeURIComponent(
													'```bash\n' +
														escapeSpecialChar(
															item
														) +
														'```'
												);
												await fetch(
													`${process.env.BASE_URL}/sendMessage?${param + item}`
												);
											}
										} else {
											error = encodeURIComponent(
												'```bash\n' +
													escapeSpecialChar(error) +
													'```'
											);
											fetch(
												`${process.env.BASE_URL}/sendMessage?${param + error}`
											).catch(console.log);
										}
									}

									if (output) {
										if (output.length > 4096) {
											output = chunkSubstr(output, 4096);

											for (const key in output) {
												let item = output[key];
												item = encodeURIComponent(
													'```bash\n' +
														escapeSpecialChar(
															item
														) +
														'```'
												);
												await fetch(
													`${process.env.BASE_URL}/sendMessage?${param + item}`
												);
											}
										} else {
											output = encodeURIComponent(
												'```bash\n' +
													escapeSpecialChar(output) +
													'```'
											);
											fetch(
												`${process.env.BASE_URL}/sendMessage?${param + output}`
											).catch(console.log);
										}
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
								sudo.once('exit', async () => {
									if (error) {
										if (error.length > 4096) {
											error = chunkSubstr(error, 4096);
											for (const key in error) {
												let item = error[key];
												item = encodeURIComponent(
													'```bash\n' +
														escapeSpecialChar(
															item
														) +
														'```'
												);
												await fetch(
													`${process.env.BASE_URL}/sendMessage?${param + item}`
												);
											}
										} else {
											error = encodeURIComponent(
												'```bash\n' +
													escapeSpecialChar(error) +
													'```'
											);
											fetch(
												`${process.env.BASE_URL}/sendMessage?${param + error}`
											).catch(console.log);
										}
									}

									if (output) {
										if (output.length > 4096) {
											output = chunkSubstr(output, 4096);

											for (const key in output) {
												let item = output[key];
												item = encodeURIComponent(
													'```bash\n' +
														escapeSpecialChar(
															item
														) +
														'```'
												);
												await fetch(
													`${process.env.BASE_URL}/sendMessage?${param + item}`
												);
											}
										} else {
											output = encodeURIComponent(
												'```bash\n' +
													escapeSpecialChar(output) +
													'```'
											);
											fetch(
												`${process.env.BASE_URL}/sendMessage?${param + output}`
											).catch(console.log);
										}
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

function fetch(link) {
	return new Promise((resolve, reject) => {
		get(link, { timeout: 60e3 }, (res) => {
			let buff = Buffer.alloc(0);
			res.on(
				'data',
				(chunk) => (buff = Buffer.concat([buff, Buffer.from(chunk)]))
			);
			res.on('error', reject);
			res.on('end', () => resolve(buff));
		}).on('error', (e) => {
			if (e.name == 'AggregateError') {
				for (let index = 0; index < e.errors.length; index++) {
					switch (e.errors[index].code) {
						case 'ENETUNREACH':
						case 'ETIMEDOUT':
							console.log(
								'Bad internet connection: %s! retry...',
								e.errors[index].code
							);
							break;
						case 'ECONNRESET':
							console.log(
								'Peer decided to close socket: %s! retry...',
								e.errors[index].code
							);
							break;
						default:
							console.log(
								'Unhandled error code: %s! retry...',
								e.errors[index].code
							);
					}
				}
			} else if (e.code == 'ECONNRESET') {
				console.log(
					'Peer decided to close socket: %s! retry...',
					e.code
				);
			} else console.log('Unhandled error code: %s! retry...', e.code);

			fetch(link).then(resolve).catch(reject);
		});
	});
}

function escapeSpecialChar(text) {
	// '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'
	const regex = /[\_\*\[\]\~\`\(\)\>\#\+\-\=\{\}\|\!\.]/g;
	return text.replace(regex, '\\$&');
}

function chunkSubstr(str, size) {
	const numChunks = Math.ceil(str.length / size);
	const chunks = new Array(numChunks);

	for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
		chunks[i] = str.substr(o, size);
	}

	return chunks;
}
