# pull base plumber/R image
FROM rstudio/plumber

# set workingdirectory
WORKDIR /app

#copy everything into workingdirectory
COPY . /app

RUN apt-get update && apt-get install -y \
    # required for sf, raster, terra, gdalcubes, rgeos, rgdal, doParallel
    libudunits2-dev \ 
    libgdal-dev \
    libgeos-dev \
    libproj-dev

# install r packages in docker container
RUN R -e "install.packages('sf')"
RUN R -e "install.packages('raster')"
RUN R -e "install.packages('terra')"
RUN R -e "install.packages('gdalcubes')"
RUN R -e "install.packages('rgeos')"
RUN R -e "install.packages('rgdal')"
RUN R -e "install.packages('doParallel')"

RUN R -e "install.packages('rstac')"
RUN R -e "install.packages('sp')"
RUN R -e "install.packages('caret')"
RUN R -e "install.packages('CAST')"
RUN R -e "install.packages('latticeExtra')"
RUN R -e "install.packages('foreach')"
RUN R -e "install.packages('iterators')"
RUN R -e "install.packages('parallel')"
RUN R -e "install.packages('magrittr')"
RUN R -e "install.packages('geosphere')"
RUN R -e "install.packages('jsonlite')"
RUN R -e "install.packages('yaml')"
RUN R -e "install.packages('randomForest')"

# start plumberapi
CMD ["/app/plumberapi.R"]

