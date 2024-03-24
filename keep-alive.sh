#!/bin/sh

while :;do
	for port in "$@"
	do
	nc -w 1 -N  103.127.97.64 $port < <(echo -n);
	echo -n $?;
	done
        sleep 2;
done

