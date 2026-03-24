# SpiceDirect
## Installation and deployment guide
### Linux(Ubuntu 20.04) prerequisites
#### Download and install mongodb v5
```install nodejs 16.14.0(use https://github.com/nvm-sh/nvm)```
```
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
===FREEZE MONGO PACKAGES FROM BEING UPGRADED AUTOMATICALLY BY apt-get==========
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-database hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-shell hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections
```

### Windows(11) prerequisites
```
install mongodb(community service as service user), include compass
install nodejs 20 LTS
install git
install notepad++ or whatever preferred text editor
```

### Install certbot using their guide and generate necessary SSL certificate+key
> NOTE THAT THE DNS MAPPING FOR THE DOMAIN SHOULD BE CONFIGURED TO POINT TO THE CURRENT PC PRIOR TO RUNNING CERTBOT

### Renew Certs
> Check existing certs(certbot commands must be run with admin terminal)
> 
> Prior to renewing, port 80 needs to be open so use xampp to stop apache server for legacy service, restart when done
> 
> Check existing certs:
> > certbot certificates
> 
> Test cert renewal
> > certbot renew --dry-run
> 
> Renew
> > certbot renew
> 
> New certs will be found in:
> > C:/certbot/archive/spicedirectwholesale.co.uk/
> >
> > (actual server has this path used in .env file)
>
> Copy the following files to the server/tls directory and rename as follows:
> 
> >cert1.pem -> server.crt
>  >
> > privkey1.pem -> server.key
> 
> Restart service

### Installation, building and run
> Clone repo and cd into root directory
> 
> NOTE: when running server, .env files will be ready from directory that node is executed from, so use /server directory to execute src/server.js, do not cd into src
> 
>- inside app/client:
>  > create a copy of the .env file, call it ".env.production" and fill in production values
>
>  > run npm install --production
> 
> 
>- inside app/server:
>  > copy .env.default to .env and fill production values appropriately(ensure fields below are enabled)
>
>  > NODE_ENV='production'
>   > 
>  > HELMET=1
>   > 
>  > CORS=0
>   > 
>  > DOMAIN='https://website-url'
>   > 
>  > TLS=1
>   > 
>  > key/cert files assign full path in string(use server.key and server.crt respectively)
>   > 
>  > AUTH0=1
>   > 
>  > TOKEN_ISSUER=''
>   > 
>  > TOKEN_AUDIENCE=''
>   > 
>  > mongodb details can be left to default
>   > 
>
>  > run npm install --production
> 
>- configure DNS for domain
> 
>- install PM2
>  > npm install pm2 -g
>- run with pm2(from /app/server directory)
>  > pm2 start .\src\server.js --name spice-direct
>- On Windows it may fail to run due to permission issues so run the following command
>  > Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
   
- useful PM2 commands
```
 pm2 list       //list all running applications
 pm2 stop       <app_name|namespace|id|'all'|json_conf>
 pm2 restart    <app_name|namespace|id|'all'|json_conf>
 pm2 delete     <app_name|namespace|id|'all'|json_conf>
 pm2 describe   <id|app_name>
 pm2 monit      //monitor logs
 pm2 logs APP-NAME # Display APP-NAME logs
 pm2 reload all //reload all pm2 managed apps

//Enabled PM2 running on startup with currently running services
//Generate Startup Script
pm2 startup
//Freeze your process list across server restart
pm2 save
```

- Windows PM2 on startup
```
# Make sure git bash is installed
# Schedule a task in windows task scheduler
# General: Run whether user is logged on or not + Run with highest privileges + config for win10
# Trigger: at system startup + stop task if running over 30 mins + Enabled
# Action: start a program -> point to git-bash.exe -> argument .\system_start.sh -> start in dir SCRIPTS
```

### Routeplanner running on Windows
```
pm2 start ecosystem.config.js
```

```
Pre-requisite commands, might not work but devs should try to work out the final specifics:
=============================
osrm setup:(run following commands)

curl -L -o uk-latest.osm.pbf https://download.geofabrik.de/europe/great-britain-latest.osm.pbf (press enter)
docker pull osrm/osrm-backend (press enter)
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/uk-latest.osm.pbf (press enter)
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-partition /data/uk-latest.osrm  (press enter)
docker run -t -v "${PWD}:/data" osrm/osrm-backend osrm-customize /data/uk-latest.osrm  (press enter)

docker run -d --name osrm_server -p 6000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/uk-latest.osrm

docker stop osrm_server
docker start osrm_server
=============================

Django in localhost:

python version 3/13.2

create a new folder (route)
go inside of route
git clone https://github.com/khurram-shahzad-12/routeplanner


create virtual env inside of route folder
py -m venv "virtual_env"  (press enter)
cd virtual_env/Scripts    (press enter)
activate.bat              (press enter)


(Django version 5.1.7)
py -m pip install Django press enter

cd ../../ press enter
go inside your project routeplanner
cd routeplanner press enter


pip install -r requirements.txt  press enter

py manage.py runserver 5000  press enter 

```

```
Once Routeplanner repo is copied and pre-requisite steps completed
Run on git bash:
pm2 start cmd.exe --name routeplanner --interpreter none -- /c "cd /d C:\routeplanner && call env\Scripts\activate.bat && python manage.py runserver_plus --cert-file ssl\cert7.pem --key-file ssl\privkey7.pem 0.0.0.0:5000"
```

### Backup and Restore MongoDB
```
install mongo database tools and set environment variables from: https://www.mongodb.com/docs/database-tools/installation/installation-windows/ 

command: mongodump -o c:\mongodump
remote url command: .\mongodump.exe mongodb://URL_OR_HOST:27017 --username USERNAME --password PASSWORD --out "SOME_PATH"

# cd into mongodump path and run the following, path variable relates to foldername of database
Compress-Archive -Path spice_direct -DestinationPath backup_mongo.zip -Force

# cp zip file to dropbox folder
Copy-Item "backup_mongo.zip" -Destination "C:\dropbox_test" -Force


# To restore run the following command with path to folder containing the folder spice_direct
[OLD]command: mongorestore c:\PATH
.\mongorestore.exe mongodb://mongoURL(eg localhost:27017) "/path_to_folder_containing_spice_direct_folder"
.\mongorestore.exe mongodb://mongoURL(eg localhost:27017) --username USERNAME --password PASSWORD "/path_to_folder_containing_spice_direct_folder"

REFER TO SCRIPTS FOLDER FOR LIVE WORKING EXAMPLES

# Schedule a task in windows task scheduler
# Action: start a program
# Program/script: Powershell.exe
# Argument: .\script_name.ps1
# Start in: Path to folder containig script
```

### Ubuntu Test Server MongoDB
```
SSH into the test server
Bring down the docker container for mongoDB, this should delete the whole thing, then bring it back up
ftp db backup zip to Downloads, can use filezilla
unzip contents to Downloads/backup(make sure its empty first)
install the unzip command if missing
Download mongoDB tools from their site if missing
cd into mongotools/bin
exec:
./mongorestore mongodb://localhost:27017 --username admin --password MegaDumbPassword ../../backup
```

### MongoDB setup for local dev(Docker)
```
Install Docker desktop
Open SpiceDirect root directory in terminal
Run command: docker compose up -d
Once run, it should be visible in docker desktop, can then be run/disabled from there. YML file contains auth details
```

### Mongo Shell commands
```
The following will be useful for data manipulation
# use <collection_name>
# db.sub-collection.updateMany({}, {$set:{"fieldname": "value"}}) //updateMany with empty {} will affect all documents
# db.sub-collection.updateMany({}, {$unset:{"fieldname": ""}}) //same as above but will remove field from document
# db.sub-collection.updateMany({}, {$set:{sales_rep: ObjectId("ID HERE")}}) //same as above but will remove field from document
```

### User Access Control
> A custom "Action" was added in Auth0 to append role data to a user token post sign-in
```
From the User Management section of the Auth0 dashboard, you can create, edit and assign Roles. For each Role, 
permissions can be assigned to them.
Permissions can be created/deleted from the Auth0 dashboard by navigating to Applications > APIs > select API > Permissions tab
```
### Revert PRODUCTION branch if release has issues
```
checkout PRODUCTION branch
in terminal use git log and find previous merge commit
will have the commit hash above the author
Copy hash

git reset --hard COMMIT_HASH
git push -f origin PRODUCTION

On server:
git fetch origin
git reset --hard origin/PRODUCTION

run deploy script
```