# Control center for my super-duper tiny-mini serper XD

## Usage

```
git clone https://github.com/RealYukiSan/control-center.git
cd control-center
touch track_message
chmod +x start-service.js
setsid start-service.js &>/tmp/start-service.log </dev/null
```

## Setup telegram bot
read the official docs.

## Tips

### test keep-alive gwrok

use ncat for testing purposes: `ncat --verbose -k -l -p 6969`

see [the gist](https://gist.github.com/RealYukiSan/e0feea6d8fbf1b0963bab570e5828d57) for further information.

### execute via telegram bot

fetch newest update from git remote and restart the bot (*NEED UPDATE, NOT WORK!*):

```
exec git pull && kill $(ps aux | grep start-service | awk '{print $2}' | head -1) && setsid start-service.js &>/tmp/control-center.log </dev/null;exit
```

### ngrok
read [the gist](https://gist.github.com/RealYukiSan/1e0ad1fc07c41b26b0d54986f248ff09)

### monitoring running process

```
ps -eF | grep -v '\[*\]' | less
```

filter the list that omit the word 'kworker' and 'systemd' to shorten the list