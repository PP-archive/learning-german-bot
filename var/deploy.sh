#!/usr/bin/env bash

npm i
npm prune

# pm2 launch or restart
currentlyActive=$(pm2 list | grep "bot" | grep online)
echo "Currently active: ${currentlyActive}"

# do the start if the length is 0
if [ -z "$currentlyActive" ]
    then
    NODE_ENV=production DEBUG=* pm2 start index.js -n bot -i 0 -f
else
    pm2 restart bot
fi

echo "Deploy is finished"