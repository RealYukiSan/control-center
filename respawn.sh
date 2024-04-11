#!/usr/bin/sh

git pull && kill $(ps aux | grep start-service | awk '{print $2}' | head -1) && setsid ./start-service.js &>/tmp/control-center.log </dev/null
