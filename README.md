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

# Installation
Our software supports multiple devices and operating systems due to the usage of Docker.

## Frontend

For the Frontend part of the app, you need to install Docker on your local machine or web-hosting server and simply run the Docker command.
To install the frontend part of the "Spredmo-Tool" on your local machine you need to:
+ Install Docker (Docker Desktop)
+ run the following docker command:

```docker run -d -it -p 3000:3000 --name SpredmoFrontend simonmeissner/geosoft2spredmo:frontend```

Due to security reasons, we cannot include a working identification key for connecting with the AWS. So to be able to connect to your instance,
start your Docker container and run

```docker exec -it SpredmoFrontend /bin/bash```
 
and copy a valid key.pem into the "keys" folder.
 
## Backend
 
To install the backend part of the "Spredmo-Tool" on your AWS EC2-instance, you need to:
+ Install Docker for servers
+ create a folder in the root directory called "tmpextern".
+ run the following docker command:

```docker run -d --rm -p 8780:8000 -v /tmpextern:/app/tmp --name SpredmoBackend simonmeissner/geosoft2spredmo:backend ```

make sure that port 8780 of the AWS EC2-instance is opened.
 
# Requirements, Input Data

## Area of Interest
The area for which the Area of Applicability, the Dissimilarity Index and the Land-use/land cover classifications are applied. You can draw a rectangle in the Map or use  a valid JSON String.

## Model 
The trained Model which must be provided by the user as an RDS-File.

## Trainingdata 
If you have no trained Model, you must provide Training data to generate a trained model. The Training Data must be in a GeoJSON-File or in a GPKG-File.  And the Column/Attribute for LULC should be named “Landnutzungsklasse”.

## Time Period
Describes in which time periods the Sentinal 2 data may be located. A date that lies in the future cannot be selected. Also, it is not allowed if the end date is earlier than the start date. If the period is greater than 1 or 2 months, the algorithm generates a data cube for each month. But only the first one will be used later. The use of all cubes/sentinell images is not provided in this version.

## Cloud Cover
The cloud cover indicates the maximum cloud cover on the sentinal 2 data. You can set the parameter from 20-100% in steps of 10.

## Resolution
Describes the resolution of the AOI in pixels. the number of pixels in x direction is selected. The number of pixels in Y direction scales with the AOI. The following options are available:
+ very low: 200 Pixel in x Direction
+ low: 400 Pixel in x Direction
+ medium: 600 Pixel in x Direction
+ high: 800 Pixel in x Direction
+ very high: 1200 Pixel in x Direction

# Workflow

## Step 1: Choose your model or training data
Select here the option if you already have a trained model or if you only have training data.

![alt text]()

## Step 2: Choose your file
Choose your file that you want to send to the server, either a model or train data polygons. The validation will check the file type according to your selection from step 1.

## Step 3: Select your area of interest
Select your area of interest for which you want the server to calculate the results. This code must be a valid rectangle GeoJSON feature.
You can either post a code string in the input field

Or you can draw a rectangle on the leaflet map.

## Step 4: Choose your time window
Select a start and end day for the satellite picture dates. Our validation will fetch any wrong or non-processable inputs.


## Step 5: Select the desired resolution and the Cloudcover
Now you can select your resolution of the satellite images and result pictures. We recommend not to use high resolutions for big data sets. You can also select the cloud coverage of the satellite pictures.


## Step 6: Submit and process will start
Now, when all input is correct and filled, you can submit your data and the server will do the rest of the work. Please keep in mind: These calculations are very complex, so the results may need some time to appear on your download page.


## Step 7: View your results on the download page
When all work is done, you can view your results on the leaflet map and choose to download which files you want. Now you can just click the download button and enjoy your newly generated results.


# Output
As output you get the following results which can be downloaded separately.
+ Area of Applicabilty (AOA) as a Tif-File.
+ Land use/ land cover classification as a Tif-File.
+ Recommended training Points to improve the model as JSON-File. 
+ The Model as RDS-File

# Dependencies

## R Packages
+ The following R packages were used in the project:
+ sf (https://cran.uni-muenster.de/web/packages/sf/index.html) / License: GPL-2, MIT
+ raster (https://mran.microsoft.com/web/packages/raster/index.html) / License: GPL-3
+ terra https://cran.r-project.org/web/packages/terra/index.html) / License: GPL-3
+ rstac (https://cran.r-project.org/web/packages/rstac/index.html) / License: MIT
+ gdalcubes (https://cran.r-project.org/web/packages/gdalcubes/index.html) / License: MIT
+ rgeos (https://cran.r-project.org/web/packages/rgeos/index.html) / License: GPL-2, GPL-3
+ rgdal (https://cran.r-project.org/web/packages/rgdal/index.html) / License: GPL-2, GPL-3
+ sp (https://cran.r-project.org/web/packages/sp/index.html) / License: GPL-2, GPL-3
+ caret (https://mran.microsoft.com/snapshot/2017-02-04/web/packages/caret/index.html) / License: GPL-2, GPL-3
+ CAST (https://cran.r-project.org/web/packages/CAST/index.html) / License: GPL-2, GPL-3
+ latticeExtra (https://cran.r-project.org/web/packages/latticeExtra/index.html) / License: GPL-2, GPL-3
+ foreach (https://cran.r-project.org/web/packages/foreach/index.html) / License: Apache-2
+ iterators (https://cran.r-project.org/web/packages/iterators/index.html) / License: Apache-2
+ doParallel (https://cran.r-project.org/web/packages/doParallel/index.html) /License: GPL-2
+ parallel (https://www.rdocumentation.org/packages/parallel/versions/3.6.2) /License: Part of R 3.6.2
+ magrittr (https://cran.r-project.org/web/packages/magrittr/index.html) / License: MIT
+ geosphere (https://cran.r-project.org/web/packages/geosphere/index.html) / License: GPL-3
+ jsonlite (https://cran.r-project.org/web/packages/jsonlite/index.html) / License: MIT
+ yaml (https://cran.r-project.org/web/packages/yaml/index.html) / License: BSD 3
+ randomForest (https://cran.r-project.org/web/packages/randomForest/index.html) / License: GPL-2, GPL-3
+ plumber (https://cran.r-project.org/web/packages/plumber/index.html) / License: MIT

## Frontend/Backend
+ "axios": "^0.24.0"                 // Library for http requests
+ "cookie-parser": "~1.4.4"            // Library to Parse Cookie header
+ "core-js": "^3.19.1"                // Modular standard library for JavaScript
+ "debug": "~2.6.9"                // A tiny JavaScript debugging utility
+ "express": "~4.16.1"                // Express routing middleware
+ "file-saver": "^2.0.5"                // Library to save files on the client-side
+ "filereader": "^0.10.3"                // Library to read a glob of file
+ "fs": "0.0.1-security"                // Library for file system functionality
+ "geojson-validation": "^1.0.2"            // Library to check valid JSON objects
+ "georaster": "^1.5.6"                // Wrapper around Georeferenced Rasters
+ "georaster-layer-for-leaflet": "^3.5.0"        // Library to display geotiffs on Leaflet
+ "geotiff": "^1.0.9"                // Library for GeoTIFF image decoding in Javascript
+ "http-errors": "~1.6.3"                // Create HTTP errors for Express, Koa, Connect, etc. with ease
+ "leaflet-geotiff-2": "^1.1.0"            // A LeafletJS plugin for displaying geoTIFF raster data
+ "morgan": "~1.9.1"                // HTTP request logger middleware for node.js
+ "multer": "^1.4.4"                 // Library for local file management
+ "node-scp": "0.0.16"                // A lightweight, fast and secure module to perform SCP commands for NodeJS based on SSH2
+ "nodemon": "^2.0.15"                // library for Simple monitor script for use during development of a node.js app.
+ "plotty": "^0.4.7"                // library for helping plot 2D data
+ "pug": "^3.0.2"                    // template engine for Node. js
+ "scp": "0.0.3"                    // Library for connecting and exchanging files with an AWS instance via scp


