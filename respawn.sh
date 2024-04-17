#!/usr/bin/sh

if [ $# -lt 2 ]; then
    echo 'No enough arguments supplied'
    echo 'Plz execute it through 'pacman -Syu' on the telegram command'
else
    if [[ "$1" =~ ^"https://api.telegram.org/bot" ]];then
        tmp_file=$(mktemp)
        time_output=$({ time {
                git_output=$(git pull 2>"$tmp_file")
                curl \
                    --data-urlencode "text=execute git pull..." \
                    -s "$1/sendMessage?chat_id=$2"
                if [[ $? -eq 0 ]];then
                    pid=$(ps -eF | grep start-service | awk '{print $2}' | head -1)
                    if [[ -n $pid ]];then
                        kill "$pid" 2>"$tmp_file";
                        if [[ $? -eq 0 ]];then
                            curl \
                            --data-urlencode "text=restarting program..." \
                            -s "$1/sendMessage?chat_id=$2"
                            # hell yeah, -f option prevent this shit from waiting and hang-ing
                            setsid -f "./start-service.js" &>/tmp/control-center.log </dev/null
                        else
                            error=$(cat "$tmp_file")
                            curl \
                                --data-urlencode "text=$error" \
                                -s "$1/sendMessage?chat_id=$2"
                        fi
                    fi
                else
                    error=$(cat "$tmp_file")
                    curl \
                        --data-urlencode "text=$error" \
                        -s "$1/sendMessage?chat_id=$2"
                fi
                curl \
                    --data-urlencode "text=$git_output" \
                    -s "$1/sendMessage?chat_id=$2"
            } &>/dev/null; # suppress curl stdout
        } 2>&1)
        curl \
            --data-urlencode "text=$time_output" \
            -s "$1/sendMessage?chat_id=$2"
        rm "$tmp_file"
    else
        echo "invalid args"
    fi
fi

