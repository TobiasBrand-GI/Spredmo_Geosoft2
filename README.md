# Spredmo_Geosoft2
A Webtool to calculate the Area of Applicability of a given project

# Authors
Project of the course Geosoftware 2 at the Institute of Geoinformatics in Münster  by Tobias Brand, Gustav Freiherr von Arnim, Thomas Kujawa, Simon Meißner, Jan Hoping 

# General information
We will use a Land-use/landcover classifications based on Sentinel-2A EO-data.
Machine learning algorithms will be used for the classification.
The evaluation is done by the Dissimilarity Index or the Area of Applicability.
The AoA makes it possible to determine whether the trained model is applicable to the investigated area is applicable. The Dissimilarity Index makes statements about how similar the trained model is to the investigated area.
The user has the possibility to either use an already trained model or to upload training data on the basis of which a trained model is created.


## Installation
Our software supports multiple devices and operating systems due to the usage of Docker.
To install the "Spredmo-Tool" on your AWS EC2 instance, you need to:
+ Install Docker for servers
+ Install an R work environment on your instance.
+ Start up the Docker Container

For the Frontend part of the app, you need to install Docker on your local machine or web-hosting server and simply run the Docker Container.
Due to security reasons, we cannot include a working identification key for connecting with the AWS. So to be able to connect to your instance,
start your Docker container and run

 ```docker exec -it <container name> /bin/bash```
 
  and copy a valid key.pem into the
  
 ```SPREDMO_GEOSOFT2/spredmoTool/keys ``` folder.
