#!/usr/bin/node

const { spawn } = require('node:child_process');
require('dotenv').config();

const child = spawn('gwrok', ['client', '--target-addr', '127.0.0.1', '--target-port', process.env.SERVICE_PORT, '--server-addr', process.env.GWROK_IP, '--server-port', '9999']);

child.stdout.on('data', (data) => {
        if (data.toString().startsWith('Excellent')) {
		const ephPort = data.toString().split(':')[2];
		const text = encodeURIComponent(`IP \`${process.env.GWROK_IP.replace(/\./g, '\\.')}\`\nPort \`${ephPort}\``);
		const param = `chat_id=${process.env.OWNER_ID}&parse_mode=MarkdownV2&text=${text}`;
                fetch(`${process.env.BASE_URL}/sendMessage?${param}`)
			.catch(console.log)
			.then(res => res.json())
		const keepAlive = spawn('./keep-alive.sh', [ephPort]);
		keepAlive.stdout.on('data', (data) => {
			if (data.toString() == 1) {
				// make sure to start the service first. So keep alive will not complaint.
				const error = encodeURIComponent('*Alert*: something went wrong\\!\nPlease check your mini\\-serper \\>///<');
				const param = `chat_id=5599651385&parse_mode=MarkdownV2&text=${error}`;
				fetch(`${process.env.BASE_URL}/sendMessage?${param}`)
					.catch(console.log)
					.then(res => res.json())
					.then(res => process.exit());
			}
		});
		recursion();
	}
});

let last_message;
async function recursion() {
	try {
		const param = `timeout=300&offset=${last_message}`;
		const response = await fetch(`${process.env.BASE_URL}/getUpdates?${param}`)
			.then(res => res.json())
		if (response.ok) {
			if (response.result.length) {
				const message = response.result[response.result.length - 1];
				last_message = message.update_id + 1;
				console.log(message);
			}
			recursion();
		} else console.log(response)
	} catch(err) {
		console.log(err)
	}
}

