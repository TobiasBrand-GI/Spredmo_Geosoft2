FROM rstudio/plumber

WORKDIR /app

COPY . /app

RUN apt-get update && apt-get install -y

RUN R -e "install.packages(c('Rcpp', 'rgdal', 'sp', 'raster'))"
#RUN R -e "install.packages('sp')"
#RUN R -e "install.packages('raster')"
#RUN R -e "install.packages('sf')"
#RUN R -e "install.packages('rstac')"
#RUN R -e "install.packages('gdalcubes')"
RUN R -e "install.packages('terra')"
#RUN R -e "install.packages('caret')"
#RUN R -e "install.packages('CAST')"
#RUN R -e "install.packages('latticeExtra')"
#RUN R -e "install.packages('foreach')"
#RUN R -e "install.packages('iterators')"
#RUN R -e "install.packages('doParallel')"
#RUN R -e "install.packages('parallel')"
#RUN R -e "install.packages('magrittr')"
#RUN R -e "install.packages('geosphere')"
#RUN R -e "install.packages('jsonlite')"
#RUN R -e "install.packages('rgeos')"
#RUN R -e "install.packages('rgdal')"


CMD ["/app/testapi.R"]