#!/bin/bash

echo "0. User and pwd"
echo "user: "$(id)
echo "pwd: "$(pwd)

# first steps
echo "1. Updating and upgrading"
sudo apt-get update
sudo apt-get upgrade -y
printf '\n%s\n%s\n%s\n%s\n' 'export LC_CTYPE=en_US.UTF-8' 'export LC_ALL=en_US.UTF-8' 'export LANG=en_US.UTF-8' 'export LANGUAGE=en_US.UTF-8' >> ~/.profile
. ~/.profile
sudo locale-gen "en_US.UTF-8"
sudo touch /var/lib/cloud/instance/locale-check.skip


# installing the mongodb
echo "2. Install mongodb"
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# preparing the init file
echo "
use admin;
db.createUser(
  {
    user: \"admin\",
    pwd: \"n2Vh3dQGMJ\",
    roles: [ { role: \"userAdminAnyDatabase\", db: \"admin\" } ]
  }
);

use LearningGermanBot;
db.createUser(
   {
     user: \"LearningGermanBot\",
     pwd: \"KK96MpPtgu\",
     roles: [ \"readWrite\", \"dbAdmin\" ]
   }
);" > init.js

# making the initial configuration
mongo < init.js
rm init.js

# edit mongod.conf file to enable the authorization
sudo sed -i 's/#security:/security:\n  authorization: enabled/g' /etc/mongod.conf
sudo sed -i 's/  bindIp: 127.0.0.1/#  bindIp: 127.0.0.1/g' /etc/mongod.conf

# restarting the mongodb server
sudo service mongod restart