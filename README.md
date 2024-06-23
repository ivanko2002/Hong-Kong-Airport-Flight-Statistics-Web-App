Prerequisite

Set up a LAMP docker container. \n
Download the zip file and unzip at a directory at your own choice.
Run the docker desktop program.
Open a terminal at the folder and enter command "docker compose up"
You should see a structure as follows:
   docker_set
   ├── docker-compose.yml
   ├── mysql
   |     ├── data
   ├── php-apache
   |     ├── Dockerfile
   └── public_html
    
Download the public_html folder and the folder structure should look like this
   public_html
   ├── flight.php
   ├── iata.json
   ├── styles.css
   ├── main.js
   └── index.html

Finally, copy and paste the content, or simply replace the old public_html folder in the docker set.
Double click on the index.html and start playing!
