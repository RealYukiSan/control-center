# Control center for my super-duper tiny-mini serper XD

## Requirement
stable Node.js version.

## Usage

```
git clone https://github.com/RealYukiSan/control-center.git
cd control-center
touch track_message
chmod +x start-service.js
setsid start-service.js &>/tmp/start-service.log </dev/null
```

optional, add soft-link to executable:
```
ln -vs $(pwd)/start-service.js /usr/local/bin/start-service
chmod +x /usr/local/bin/start-service
```

## Setup telegram bot
read the official docs.

## Tips

### test keep-alive gwrok

use ncat for testing purposes: `ncat --verbose -k -l -p 6969`

see [the gist](https://gist.github.com/RealYukiSan/e0feea6d8fbf1b0963bab570e5828d57) for further information.

### execute via telegram bot

fetch newest update from git remote and restart the bot:

```
exec setsid ./respawn.sh
```

### ngrok
read [the gist](https://gist.github.com/RealYukiSan/1e0ad1fc07c41b26b0d54986f248ff09)

### monitoring running process

```bash
ps -eF | grep -v '\[*\]' | less
# or
ps -F --ppid 2 -p 2 --deselect | less
```

filter the list that only display non-kernel process in order to shorten the list, reference: [stackoverflow](https://unix.stackexchange.com/questions/78583/can-ps-display-only-non-kernel-processes-on-linux)

## Question

- wondering why the `sh -c` not exit when I execute `setsid` program?
- and wondering why, isolating chain of command to `respawn.sh` and call `sh -c setsid` works like a charm? unlike call it directly with `sh -c`