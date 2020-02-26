// SCRIPT 2 - Okavango Delta annual flood maps
      
    // In this script we'll import the annual Landsat SWIR composites and classify them into flood maps.
   
    // The flood maps are created using a SWIR thresholding methodology taken from:
    //    "Wolski, P., Murray-hudsoren, M., Thito, K. & Cassidy, L. (2017) Keeping it simple:Monitoring flood extent in large data-poor
    //     wetlands using MODIS SWIR data. International Journal of Applied Earth Observations and Geoinformation, 57, 224–234."

    // We calculate the median SWIR value for designated 'wet' and 'dry' areas for each image and calulate a threshold value using
    // SWIRthreshold = SWIRwet + 0.3 ∗(SWIRdry − SWIRwet)
    // Pixels are classified as flooded if they have a SWIR value less than the SWIRthreshold.
    
    // We can calculate the total inundated area for each year and the annual flood maps can be exported for further processing.
    
    // We will also create two summary maps to look at the interannual changes in flooding, by summing and calculting the variance of all the flood maps  



// Table of Contents
// 0. Convert to imports
// 1. Load the Landsat composites
// 2. Calculate the individual threshold value for each image and apply to composites  
// 3. Inspect and export flood maps
// 4. Calculate and export annual flood extent
// 5. Inter-annual variation in flooding - sum of flood maps
// 6. Inter-annual variation in flooding - variance of flood maps



// 0. Convert to imports
// Hover over this data and select 'convert' to convert all these to imports
var Okavango_Delta = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[21.995671332376105, -18.603263588516672],
          [22.290686112992944, -18.941764024773665],
          [21.945233677078022, -19.496174215276806],
          [22.84439596955849, -20.312802846252264],
          [22.446828220535053, -20.553449920435497],
          [22.55600485627724, -20.70253839312854],
          [22.92130026643349, -20.473704939798594],
          [23.13553366487099, -20.33598309288628],
          [23.39371237580849, -20.14528706879738],
          [23.444524143386616, -20.08209976623566],
          [23.67935690705849, -19.820053034004616],
          [24.256825779128803, -19.12348461449692],
          [23.482976291824116, -18.67003886902422],
          [23.367619846511616, -18.60302283521612],
          [23.271782594769547, -18.545872902487968],
          [23.06618246858193, -18.425270339271584],
          [22.455754612136616, -18.790340936600785],
          [21.83090720002724, -18.190590538447204],
          [21.700444553542866, -18.272112604111847]]]),
    Dry_areas = 
    /* color: #ffad19 */
    /* shown: false */
    ee.Geometry.MultiPolygon(
        [[[[23.32122802734375, -18.687878686034182],
           [23.038330078125, -18.88809668344591],
           [23.4228515625, -18.95045351813069],
           [23.57940673828125, -19.07509724212452],
           [23.7249755859375, -18.984220415249744]]],
         [[[22.015228271484375, -19.54943746814108],
           [22.30224609375, -19.01927879438547],
           [22.273406982421875, -19.002399756194873],
           [21.963043212890625, -19.50025322698226]]],
         [[[22.72796630859375, -20.19519063647449],
           [22.858428955078125, -20.32016017148391],
           [22.950439453125, -20.197768342815444],
           [22.874908447265625, -19.95398725103919],
           [22.776031494140625, -19.82097398030796],
           [22.718353271484375, -19.93462334027723],
           [22.721099853515625, -20.122997556207757]]],
         [[[23.51554918778993, -19.36394750122515],
           [23.70231565044446, -19.442312328113726],
           [23.756217080819624, -19.388885640133672],
           [23.64292079122947, -19.309199911461246],
           [23.56377448396779, -19.232892056949687],
           [23.488770167837174, -19.262211360816373]]]]),
    Wet_areas = 
    /* color: #2ebdc5 */
    /* shown: false */
    ee.Geometry.MultiPolygon(
        [[[[22.0880126953125, -18.540814645793187],
           [22.10174560546875, -18.547324589827422],
           [22.10775375366211, -18.557902719578223],
           [22.099857330322266, -18.57027016292044],
           [22.103805541992188, -18.580196014759085],
           [22.112387960351725, -18.599802054260817],
           [22.117881774902344, -18.59939520219874],
           [22.113932520484354, -18.588086375611947],
           [22.11444854736328, -18.566364751355945],
           [22.118053436279297, -18.548463804521912],
           [22.096595764160156, -18.529096121414803],
           [22.083892822265625, -18.535118241255837]]],
         [[[22.124919891357422, -18.65632920420703],
           [22.139339447021484, -18.67129154604106],
           [22.137451171875, -18.678934841643358],
           [22.14740753173828, -18.691456091582587],
           [22.159767150878906, -18.69714726284876],
           [22.178993225097656, -18.683488130509772],
           [22.16817855834961, -18.67926008061969],
           [22.145004272460938, -18.66104573700441],
           [22.143630981445312, -18.652751057394823],
           [22.1484375, -18.645919840389954],
           [22.148265838623047, -18.636648463444576],
           [22.116680145263672, -18.639088348548686]]],
         [[[22.438030242919922, -18.87770161759977],
           [22.454509735107422, -18.896379789609394],
           [22.48077392578125, -18.878513755347228],
           [22.44884490966797, -18.853660558213864],
           [22.435455322265625, -18.86470687839804]]],
         [[[22.431163787841797, -19.05432978060489],
           [22.432708740234375, -19.067471992091946],
           [22.438030242919922, -19.099268587022358],
           [22.46429443359375, -19.09894416280742],
           [22.46377944946289, -19.07931531480555],
           [22.46206283569336, -19.058386129839025],
           [22.455711364746094, -19.040050642346355],
           [22.44781494140625, -19.034371098194022],
           [22.434597232045462, -19.026825399067594],
           [22.426185607910156, -19.04102425898]]],
         [[[22.553386688232422, -19.065849553207002],
           [22.559051513671875, -19.103648251663632],
           [22.571067810058594, -19.112569432062173],
           [22.584570034460512, -19.147524222018426],
           [22.58502919905493, -19.188316621819364],
           [22.620974630180854, -19.187853137633745],
           [22.6156130169486, -19.16097963781838],
           [22.611408233642578, -19.127653241973498],
           [22.578792572021484, -19.069418897792662],
           [22.574501037597656, -19.055952332202317],
           [22.596817016601562, -19.048163939806823],
           [22.58892059326172, -19.018629632291812],
           [22.586002349853516, -19.008729596277238],
           [22.574844360351562, -19.0090541969679],
           [22.58136749267578, -19.028204516046813],
           [22.578105926513672, -19.03485792387593],
           [22.566261291503906, -19.038752477953135],
           [22.548580169677734, -19.045405463167203],
           [22.563514709472656, -19.068120963199693]]],
         [[[22.676467009428848, -19.108353497389036],
           [22.719040868139814, -19.10494705373841],
           [22.75474797515392, -19.105271479033785],
           [22.75277444147764, -19.093916404676317],
           [22.760756967266502, -19.088725477610442],
           [22.785647828012884, -19.10429743364319],
           [22.802469496728804, -19.094482626669176],
           [22.797320496503517, -19.064713477022156],
           [22.74049923637108, -19.076232086183257],
           [22.71629339231538, -19.074771341556794],
           [22.70067164938098, -19.07444689765876],
           [22.690543852358815, -19.075097100278516],
           [22.66977193076366, -19.077368479473492]]],
         [[[22.842292566528954, -19.042971269500807],
           [22.82684299729351, -19.047676961283067],
           [22.827014659089855, -19.06617390467709],
           [22.81156508978995, -19.069905493944223],
           [22.814140017912678, -19.08353319343182],
           [22.83937431446816, -19.082397594728377],
           [22.839374314481915, -19.076881718350624],
           [22.85036067487499, -19.074934894620583],
           [22.850532336750803, -19.0832087375433],
           [22.81396835601845, -19.085479916126847],
           [22.817401593545128, -19.101863925100584],
           [22.893962792863817, -19.105108090898764],
           [22.8934478229678, -19.102675017817482],
           [22.89293294742197, -19.091482231079656],
           [22.891902938274256, -19.072339091326533],
           [22.89070121683926, -19.060657488263722],
           [22.8505323367649, -19.060981988521338]]],
         [[[22.742385864257812, -19.34807589520214],
           [22.75096893310547, -19.35892729028163],
           [22.77294158935547, -19.341111186774523],
           [22.75096893310547, -19.324265082201805],
           [22.727622985839844, -19.338681567404727]]]]),
    imageVisParam_testAnnualFloodMap = {'opacity':1,'bands':['B7'],'gamma':1},
    imageVisParam_AnnualFloodMap_Sum = {'opacity':1,'bands':['B7'],'min':0,'max':28,'gamma':1},
    imageVisParam_AnnualFloodMap_Variance = {'opacity':1,'bands':['B7_variance'],'max':0.24960000000000002,'gamma':1};


// 1. Load the Landsat composites
//var annual_composites = ee.ImageCollection('users/yourname/NameOfImageCollectionFolder'); // Update the path to the location of your ImageCollection folder
var annual_composites = ee.ImageCollection('users/victoriainman/LandsatCompositesImageCollection');
Map.centerObject(Okavango_Delta, 8);



// 2. Calculate the individual threshold value for each image and apply to composites  
// Threshold function
var threshold = function(image) {
var dry = image.reduceRegion({
  reducer:ee.Reducer.median(), 
  geometry:Dry_areas, 
  scale:30,
  tileScale:16
  }).get('B7');
var wet = image.reduceRegion({
  reducer: ee.Reducer.median(),
  geometry: Wet_areas, 
  scale: 30,
  tileScale: 16
  }).get('B7');
var thresh = ee.Number(dry).subtract(ee.Number(wet)).multiply(0.3).add(wet);
var keepProperties = ['startDate', 'endDate'];
  return image.lt(thresh).copyProperties(image, keepProperties);};

// Apply this function to the annual composites
var AnnualFloodMaps = annual_composites.map(threshold);



// 3. Inspect and export flood maps
print(AnnualFloodMaps, 'AnnualFloodMaps');
// Visually inspect a flood map to ensure it's looking good
Map.addLayer(AnnualFloodMaps.filterMetadata('startDate', 'equals', '2013-07-01').first(), imageVisParam_testAnnualFloodMap, 'testFloodMap');

// Flood maps can be exported singularly using:
/*Export.image.toDrive({
  image: AnnualFloodMaps.filterMetadata('startDate', 'equals', '2013-07-01').first(), 
  description: 'Name', // Name for raster
  folder: 'Folder', // Name of Google Drive Folder
  region: Okavango_Delta, // Change depending on region of interest
  scale: 30}) */  

// Or can be exported as a batch
/*var batch = require('users/fitoprincipe/geetools:batch') 
batch.Download.ImageCollection.toDrive(
              AnnualFloodMaps, 
              'Folder', // Name of Google Drive Folder (will create if not already there)
               {scale: 30, 
               region: Okavango_Delta, // Change depending on region of interest
               name:'FloodMap_{startDate}_{endDate}'})*/



// 4. Calculate and export annual inundation extent
//Can calculate inundated area for individual images
var inundated_area_2013 = AnnualFloodMaps.filterMetadata('startDate', 'equals', '2013-07-01').first().eq(1)
                                         .multiply(ee.Image.pixelArea()).divide(1000*1000)
                                         .reduceRegion ({
                                              reducer: ee.Reducer.sum(),
                                              geometry: Okavango_Delta, // Change depending on region of interest
                                              scale: 30, 
                                              maxPixels: 1e13});
print('2013 Flood Area (in sq.km)', inundated_area_2013); //Get the sq km area for flood for this year

// Or for all years
var inundated_area = AnnualFloodMaps.map(function(image) {
  return image.eq(1)
  .multiply(ee.Image.pixelArea().divide(1000*1000))
  .reduceRegions({    
    collection: Okavango_Delta, 
    reducer: ee.Reducer.sum(), 
    scale: 30,
    tileScale: 16 
  }).map(function(f) { 
      return f.set('year', image.get('startDate'));
    });
}).flatten();
print('Annual flood Area (in sq.km)', inundated_area);

// Can export results
/*Export.table.toDrive({
  collection: inundated_area, 
  description: 'FloodArea_1990-2019', // Name of file
  folder: 'Folder', // Name of Google Drive Folder (will create if not already there)
  fileFormat: 'CSV'
});*/



// 5. Inter-annual variation in flooding - sum of flood maps

var AnnualFloodMaps_sum = ee.Image(AnnualFloodMaps.sum().int16());
Map.addLayer(AnnualFloodMaps_sum, imageVisParam_AnnualFloodMap_Sum, 'AnnualFloodMaps_sum');

/*Export.image.toDrive({
  image: AnnualFloodMaps_sum,
  description: 'AnnualFloodMaps_sum',
  region: Okavango_Delta, // Change depending on region of interest
  scale: 30,
  skipEmptyTiles: true,
  maxPixels: 1e13
})   */



// 6. Inter-annual variation in flooding - variance of flood maps
var AnnualFloodMaps_variance = AnnualFloodMaps.reduce(ee.Reducer.variance());
Map.addLayer(AnnualFloodMaps_variance, imageVisParam_AnnualFloodMap_Variance, 'AnnualFloodMaps_variance');

/*Export.image.toDrive({
  image: AnnualFloodMaps_variance,
  description: 'AnnualFloodMaps_variance',
  region: Okavango_Delta, 
  scale: 30,
  skipEmptyTiles: true,
  maxPixels: 1e13})  */
  
