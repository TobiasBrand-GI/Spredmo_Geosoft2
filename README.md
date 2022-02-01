# Spredmo_Geosoft2
A Webtool to calculate the Area of Applicability of a given project

## Installation
Our software supports multiple devices and operating systems due to the usage of Docker.
To install the "Spredmo-Tool" on your AWS EC2 instance, you need to:
+ Install Docker for servers
+ Install an R work environment on your instance.
+ Start up the Docker Container

For the Frontend part of the app, you need to install Docker on your local machine or web-hosting server and simply run the Docker Container.
Due to security reasons, we cannot include a working identification key for connecting with the AWS. So to be able to connect to your instance,
start your Docker container and run ```docker exec -it <container name> /bin/bash``` and copy a valid <mark>key.pem</mark> into the ```SPREDMO_GEOSOFT2/spredmoTool/keys ``` folder.