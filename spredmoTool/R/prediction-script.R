library(raster)
library(caret)
library(sf)
library(CAST)
#additional required packages:
library(latticeExtra)
library(foreach)
library(iterators)
library(doParallel)
library(parallel)
# library(Orcs)


#####
### Raster data (predictor variables)
warning("!!! check path !!!")
sen_ms <- stack("C:/Users/.../GitHub/Spredmo_Geosoft2/R-folder/output_2018-06-01.tif")
# rename bands
names(sen_ms) <- c("B02","B03","B04","B08","B06","B07","B8A","B11","B12","SCL")
plot(sen_ms)
# plotRGB(sen_ms,stretch="lin",r=3,g=2,b=1)


#####
# TODO:
# should not be possible only for Muenster
# ... for the whole world 
### Reference data
warning("!!! check path !!!")
trainSites <- readRDS("C:/Users/.../GitHub/OpenGeoHub_2021/data/....RDS")
names(trainSites)
trainDat <- trainSites[trainSites$Region!="Muenster",]
# names(trainDat)
validationDat <- trainSites[trainSites$Region=="Muenster",]
# names(validationDat)
# head(trainSites)

#see unique regions in train set:
unique(trainDat$Region)


#####
### Predictors and response
trainids <- createDataPartition(trainDat$ID,list=FALSE,p=0.15)
# head.matrix(trainids) # trainids is not a list, but matrix
trainDat <- trainDat[trainids,]
trainDat <- trainDat[complete.cases(trainDat),]


predictors <- head(names(sen_ms), -1) # without the "SCL"-band 
response <- "Label"
# head.matrix(response)


#####
## Model training and validation
# train the model
ctrl_default <- trainControl(method="cv", number = 3, savePredictions = TRUE)
model <- train(trainDat[,predictors],
               trainDat[,response],
               method="rf",
               metric="Kappa",
               trControl=ctrl_default,
               importance=TRUE,
               ntree=50)
model


#####
## Model prediction
prediction <- predict(sen_ms,model)


#####
## Area of Applicability
# needed packages for following code are:
#    foreach, iterators, parallel, doParallel, cast, caret
# The calculation of the AOA is quite time consuming.
# To make a bit faster we use a parallelization.
cl <- makeCluster(4)
registerDoParallel(cl)
AOA <- aoa(sen_ms,model,cl=cl)
# plot(AOA)
message(paste0("Percentage of Münster that is within the AOA: ",
               round(sum(values(AOA$AOA)==1)/ncell(AOA),2)*100," %"))
