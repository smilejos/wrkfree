# wrkfree2.0 #

### environment setup ###

1. get this repo

2. install modules
    ```
    sudo npm install -g gulp
    ./npm-install.sh
    ```

3. goto the "webServer/client/" and using gulp to start the webServer
   > NOTE: make sure ```Redis``` and ```MongoDB``` are up and running
    ```
    cd webServer/client
    gulp
    ```

4. open the "chrome" and connect to [https://localhost:3000](https://localhost:3000)
    > NOTE: install the livereload plugin on chrome can get better experience on development
    
5. addition add-on SASS framework Compass
    ```
  MAC:
    sudo gem update --system
    sudo gem install compass
  Ubuntu:
    sudo apt-get install ruby-compass
    ```
### Coding guidelines ###

* Writing tests
* Code review
* Other guidelines

### Troubleshooting ###

* Error: You need to have Ruby and Compass installed and in your system PATH for this task to work. 
  <pre>
  gem update --system && sudo gem install compass
  </pre>
