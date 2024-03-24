#!/bin/sh

while :;do
	nc -w 1 -N  103.127.97.64 $1 < <(echo -n);
	echo -n $?;
        sleep 2;
done

