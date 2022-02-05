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
 
# Requirements, Input Data

## Area of Interest
The area for which the Area of Applicability, the Dissimilarity Index and the Land-use/land cover classifications are applied. You can draw a rectangle in the Map or use  a valid JSON String.

## Model 
The trained Model which must be provided by the user as an RDS-File or Rdata-File.

## Trainingdata 
If you have no trained Model, you must provide Training data to generate a trained model. The Training Data must be in a GeoJSON-File or in a GPKG-File.  And the Column/Attribute for LULC should be named “Landnutzungsklasse”.

## Time Period
Describes in which time periods the Sentinal 2 data may be located. A date that lies in the future cannot be selected. Also, it is not allowed if the end date is earlier than the start date. If the period is greater than 1 or 2 months, the algorithm generates a data cube for each month. But only the first one will be used later. The use of all cubes/sentinell images is not provided in this version.

## Cloud Cover
The cloud cover indicates the maximum cloud cover on the sentinal 2 data. You can set the parameter from 20-100% in steps of 10.

## Resolution
Describes the resolution of the AOI in pixels. the number of pixels in x direction is selected. The number of pixels in Y direction scales with the AOI. The following options are available:
+ very low: 100 Pixel in x Direction
+ low: 200 Pixel in x Direction
+ medium: 300 Pixel in x Direction
+ high: 400 Pixel in x Direction
+ very high: 500 Pixel in x Direction
