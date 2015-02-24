##########################################################
#
#                   building web server
#
##########################################################
cd ./sharedUtils/ && npm install -d
cd ../
echo '============   sharedUtils npm installed ==========='
cd ./webServer/ && npm install -d
echo '============   web-server npm installed ============'
npm start
echo '============== client app build done ==============='
