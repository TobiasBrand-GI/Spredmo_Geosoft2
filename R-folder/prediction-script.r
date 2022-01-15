

#####
### Raster data (predictor variables)
warning("!!! check path !!!")
sen_ms <- stack("C:/Users/.../GitHub/Spredmo_Geosoft2/R-folder/output_2018-06-01.tif")

rgbplot_ms <- spplot(sen_ms[[1]],  
                     col.regions = "transparent",
                     sp.layout = rgb2spLayout(sen_ms[[3:1]], 
                                              quantiles = c(0.02, 0.98), 
                                              alpha = 1))
plot(sen_ms)
plotRGB(sen_ms,stretch="lin",r=3,g=2,b=1)


#####
# TODO:
# should not be possible only for Muenster
# ... for the whole world 
### Reference data
warning("!!! check path !!!")
trainSites <- readRDS("C:/Users/.../GitHub/OpenGeoHub_2021/data/....RDS")
names(trainSites)
trainDat <- trainSites[trainSites$Region!="Muenster",]
names(trainDat)
validationDat <- trainSites[trainSites$Region=="Muenster",]
names(validationDat)
head(trainSites)

#see unique regions in train set:
unique(trainDat$Region)


#####
### Predictors and response
set.seed(100)
trainids <- createDataPartition(trainDat$ID,list=FALSE,p=0.15)
# head.matrix(trainids) # trainids is not a list, but matrix
trainDat <- trainDat[trainids,]
trainDat <- trainDat[complete.cases(trainDat),]


predictors <- names(sen_ms)
response <- "Label"
head.matrix(response)


#####
## Model training and validation
# train the model
ctrl_default <- trainControl(method="cv", number = 3, savePredictions = TRUE)
set.seed(100)
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



###
# und weiter bin ich noch nicht gekommen :)
###




