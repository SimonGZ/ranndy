#!/bin/sh

if [ $(ps -e -o uid,cmd | grep $UID | grep node | grep -v grep | wc -l | tr -s "\n") -eq 0 ]
then
        export PATH=/usr/local/bin:$PATH
        forever start --spinSleepTime 10000 --sourceDir /home/simonganz/apps/ranndy app.js >> /home/simonganz/apps/logs/ranndy.txt 2>&1
fi
