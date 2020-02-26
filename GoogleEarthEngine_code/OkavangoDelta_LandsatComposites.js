// SCRIPT 1 - Okavango Delta annual flood maps
      
    // In this script we'll make annual Landsat Short Wave Infrared (SWIR) composites for the Delta's high flood period (July - September),
    // using Landsat 5, 7, and 8 scenes that have clouds masked and gaps filled.
    // We'll export these composites for further processing in the associated "OkavangoDelta_FloodMaps" script



// Table of Contents
// 0. Convert to imports
// 1. Cloud masking functions
// 2. Load data and apply cloud masking functions
// 3. Gap fill images
// 4. Create annual composites
// 5. Filter out bad composites
// 6. Inspect and export images



// 0. Convert to imports
// Hover over this data and select 'convert' to convert all these  to imports
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
    East_Geometry = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[23.606330968989596, -18.954653445165935],
          [23.515693761958346, -19.234962900648995],
          [23.853523351802096, -19.338660307861435],
          [23.941413976802096, -19.048142642705557]]]),
    West_Geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        'type': 'rectangle'
      }
    ] */
    ee.Geometry.Polygon(
        [[[22.029489869800955, -18.542449000564158],
          [22.029489869800955, -18.755843294623638],
          [22.304148072925955, -18.755843294623638],
          [22.304148072925955, -18.542449000564158]]], null, false),
    imageVisParam_testAnnualComposite = {'opacity':1,'bands':['B7'],'min':435,'max':3911,'gamma':1};


// 1. Cloud masking functions
// Landsat 8 function from https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC08_C01_T1_SR
function cloudMaskL8(image) {
  var cloudShadowBitMask = 1 << 3;  
  var cloudsBitMask = 1 << 5;
  var qa = image.select('pixel_qa');   
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0).and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);}

// Landsat 5 and 7 function from https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LE07_C01_T1_SR
var cloudMaskL57 = function(image) {
  var qa = image.select('pixel_qa');   
  var cloud = qa.bitwiseAnd(1 << 5).and(qa.bitwiseAnd(1 << 7)).or(qa.bitwiseAnd(1 << 3)); 
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);};



// 2. Load data (Landsat Surface Reflectance Tier 1 collections) and apply cloud masking functions
Map.centerObject(Okavango_Delta, 8);

var ls5 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR').filterBounds(Okavango_Delta).map(cloudMaskL57);//Change geometry if needed
var ls7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filterBounds(Okavango_Delta).map(cloudMaskL57);//Change geometry if needed
var ls8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filterBounds(Okavango_Delta).map(cloudMaskL8); //Change geometry if needed

// Merge image collections and select Band 7 (SWIR band)
var ls_merged57 = ee.ImageCollection(ls5.merge(ls7));
var ls_merged578 = ee.ImageCollection(ls_merged57.merge(ls8)).select('B7');



// 3. Gap fill images
// Some images have lines of masked pixels due to sensor malfunction or have small missing sections due to cloud masking. This function fills these gaps
// Gap filling algorithm from https://stackoverflow.com/questions/55256739/slc-code-not-filling-all-landsat-7-sr-gaps/
var kernelSize = 10; 
var kernel = ee.Kernel.square(kernelSize * 30, 'meters', false);
var GapFill = function(image) {
  var start = image.date().advance(-1, 'year');
  var end = image.date().advance(1, 'year');
  var fill = ls_merged578.filterDate(start, end).median();
  var regress = fill.addBands(image); 
  regress = regress.select(regress.bandNames().sort());
  var fit = regress.reduceNeighborhood(ee.Reducer.linearFit().forEach(image.bandNames()), kernel, null, false);
  var offset = fit.select('.*_offset');
  var scale = fit.select('.*_scale');
  var scaled = fill.multiply(scale).add(offset);
  return image.unmask(scaled, true).uint16();};

var ls_merged_filled = ls_merged578.map(GapFill);



// 4. Create annual composites
// Date range
var Date_Start = ee.Date('1990-01-01'); //change depending on desired date range
var Date_End = ee.Date('2019-12-31');

// Create composites using scenes between July and September of each year
var n_months = Date_End.difference(Date_Start,'month').round();
var dates = ee.List.sequence(6,n_months,12); //change these (along with code on line 81) to months you want to create composites over
var make_datelist = function(n) {
  return Date_Start.advance(n,'month')};
var dates = ee.List(dates.map(make_datelist));
var fnc = function(d1) {
  var start = ee.Date(d1);
  var end = ee.Date(d1).advance(3,'month');
  var date_range = ee.DateRange(start, end);
  var out =  ls_merged_filled   //change this to ls_merged578 if you don't want to use gap filled images (to save memory)
    .filterDate(date_range)
    .median()
    .set({startDate: start.format('YYYY-MM-dd'), endDate: end.format('YYYY-MM-dd')})
    .clip(Okavango_Delta) //change this to desired geometry
    .uint16();
  return out.set({numBands: out.bandNames().size()})};

var annual_composites_full_list = ee.ImageCollection(dates.map(fnc));
print(annual_composites_full_list, 'annual_composites_full_list');



// 5. Filter out bad composites
// Some years have composites but you want to discard them (for a variety of reasons). In our case, 4 images have large sections missing 
// (where 1 landsat scene wasn't available) and another  seems to have had issues with cloud masking. We are going to get rid of these.
// Bad images can be determined through visual inspection, or in the case of missing sections, through reduceRegion.

//Filtering out for the images that are missing west landsat scene corner
var annual_composites_filtered1 = annual_composites_full_list.map(function(x) {
  var y = x.set(ee.Image.pixelArea().multiply(x).reduceRegion({
    reducer: ee.Reducer.sum(), 
    geometry: West_Geometry,
    scale: 1000
  }));
  return y;
}).filterMetadata('area', 'not_equals', 0);

//Filtering out for the images that are missing east landsat scenes
var annual_composites_filtered2 = annual_composites_filtered1.map(function(x) {
  var y = x.set(ee.Image.pixelArea().multiply(x).reduceRegion({
    reducer: ee.Reducer.sum(), 
    geometry: East_Geometry,
    scale: 1000
  }));
  return y;
}).filterMetadata('area', 'not_equals', 0);

//  Visual inspection showed that this image was no good, so we'll filter it out
var annual_composites_final = annual_composites_filtered2.filterMetadata('startDate', 'not_equals', '1993-07-01');



// 6. Inspect and export images
// Print the final image collection
print(annual_composites_final, 'Annual_composites_final');
//Visually inspect an image to ensure it's looking good
Map.addLayer(annual_composites_final.filterMetadata('startDate', 'equals', '2013-07-01'),imageVisParam_testAnnualComposite, 'testComposite');

// Export Landsat composites to Assets
// You'll need to create a new ImageCollection folder in assets prior to running the batch export. The batch export can take a moment to start
// processing. Once it does, a list of images will appear in the Tasks tab. Click 'run' for each image

/*var batch = require('users/fitoprincipe/geetools:batch');
batch.Download.ImageCollection.toAsset(
                annual_composites_final, 
                'NameOfImageCollectionFolder', //This is the name of the ImageCollection folder you've just created
                {scale: 30, 
                 region: Okavango_Delta,    // Change geometry if necessary
                 type: 'uint16' 
                 })*/

