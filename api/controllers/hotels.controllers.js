//var dbconn = require('../data/dbconnection.js');
//var ObjectId = require('mongodb').ObjectId;
//var hotelData = require('../data/hotel-data.json');

var mongoose = require('mongoose');
var Hotel = mongoose.model('Hotel');

var runGeoQuery = function(req, res){
  //Geo spatial query
  var lng = parseFloat(req.query.lng);
  var lat = parseFloat(req.query.lat);

  //Error trapping
  if(isNaN(lng) || isNaN(lat)){
    res
      .status(400)
      .json({
          "message" : "If supplied in the query string lng and lat should be numbers"
        });
    return;
  }

  //geo JSON Object
  var point = {
    type : "Point",
    coordinates : [lng,lat]
  };

  var geoOptions = {
    spherical : true,
    maxDistance : 2000, //meters
    num : 5
  };

  Hotel
    .geoNear(point, geoOptions, function(err, results, stats){
      console.log("Geo results ",results);
      console.log("Geo stats ",stats);
      if (err) {
        console.log("Error finding hotels");
        res
          .status(500)
          .json(err);
      } else {
      res
        .status(200)
        .json(results);
    }
  });

  // Hotel.aggregate(
  //   [
  //     {
  //       '$geoNear' : {
  //         'near' : point,
  //         'spherical' : true,
  //         'maxDistance' : 2000, //meters
  //         'num' : 5
  //       }
  //     }
  //   ],
  //   function(err, results){
  //     console.log("Geo results ",results);
  //     //console.log("Geo stats ",stats);
  //     res
  //       .status(200)
  //       .json(results);
  //   }
  // );
};

module.exports.hotelsGetAll = function(req, res){

//  var db = dbconn.get(); //connected to the database
//  var collection = db.collection('hotels'); //Go to the collection

  var offset=0;
  var count=5;
  var maxCount = 10;

  if(req.query && req.query.lat && req.query.lng){
    runGeoQuery(req ,res);
    return;
  }

  if(req.query && req.query.offset){
    offset = parseInt(req.query.offset, 10);
  }

  if(req.query && req.query.count){
    count = parseInt(req.query.count, 10);
  }

  if(isNaN(offset) || isNaN(count)){
    res.status(400)
        .json({
          "message" : "If supplied in the query string count and offset should be numbers"
        });
    return;
  }

  if(count > maxCount){
    res.status(400)
        .json({
          "message" : "Count limit of " + maxCount + " exceeded."
        });
    return;
  }

  Hotel
    .find()
    .exec(function(err, hotels){
      if(err){
        console.log("Error finding hotels");
        res
          .status(500)
          .json(err);
      }
      else{
      console.log("Found hotels ", hotels.length);
      res
        .json(hotels);
      }
    });

  // collection
  //   .find({})
  //   .skip(offset)
  //   .limit(count)
  //   .toArray(function(err, docs){
  //     console.log("Found hotels ", docs);
  //     res.status(200).json(docs);
  //   });
  };

module.exports.hotelsGetOne = function(req, res){
  // var db = dbconn.get(); //connected to the database
  // var collection = db.collection('hotels'); //Go to the collection
  var hotelId = req.params.hotelId;
  console.log("GET HotelId", hotelId);

  Hotel
    .findById(hotelId)
    .exec(function(err, doc){
      var response = {
        status : 200,
        message : doc
      };
      if(err){
        console.log("Error finding Hotel.");
        response.status = 500;
        response.message = err;
      } else if(!doc){
          response.status = 404;
          response.message = {"message" : "Hotel ID not found."};
      }
      res
        .status(response.status)
        .json(response.message);
    });
};

var _splitarray = function(input){
  if(input && input.length >0){
    output = input.split(";");
  } else{
    output = [];
  }
  return output;
};

module.exports.hotelsAddOne = function(req, res){

Hotel
  .create({
    name : req.body.name,
    description : req.body.description,
    stars : parseInt(req.body.stars, 10),
    services : _splitarray(req.body.services),
    photos : _splitarray(req.body.photos),
    currency : req.body.currency,
    location : {
      address : req.body.address,
      coordinates : [
        parseFloat(req.body.lng),
        parseFloat(req.body.lat)
      ]
    }
  }, function(err, hotel){
    if(err){
      console.log("Error creating hotel");
      res
        .status(400)
        .json(err);
    }
    else {
      console.log("Done creating hotel ", hotel);
      res
        .status(201)
        .json(hotel);
    }
  });



  // var db = dbconn.get(); //connected to the database
  // var collection = db.collection('hotels'); //Go to the
  // var newHotel;
  //
  // console.log("POST new hotel");
  //
  // if(req.body && req.body.name && req.body.stars){
  //   newHotel = req.body;
  //   newHotel.stars = parseInt(req.body.stars, 10);
  //
  //   collection.insertOne(newHotel, function(err, response){
  //     console.log(response);
  //     console.log(response.ops);
  //
  //     res
  //       .status(201)
  //       .json(response.ops);
  //   });
  // }
  //
  // else{
  //   console.log("Data missing from body");
  //   res
  //     .status(400)
  //     .json({ message : "Data missing from body"});
  // }
};

module.exports.hotelsUpdateOne = function(req, res){ //find, update, save model instance

  //find
  var hotelId = req.params.hotelId;
  console.log("GET HotelId", hotelId);

  Hotel
    .findById(hotelId)
    .select("-reviews -rooms")
    .exec(function(err, doc){
      var response = {
        status : 200,
        message : doc
      };
      if(err){
        console.log("Error finding Hotel.");
        response.status = 500;
        response.message = err;
        return;
      } else if(!doc){
          response.status = 404;
          response.message = {"message" : "Hotel ID not found."};
          return;
      }

      if(response.status!=200){
        res
          .status(response.status)
          .json(response.message);
      } else { //update
          doc.name = req.body.name;
          doc.description = req.body.description;
          doc.stars = parseInt(req.body.stars,10);
          doc.services = _splitarray(req.body.services);
          doc.photos = _splitarray(req.body.photos);
          doc.currency = req.body.currency;
          doc.location = {
            address : req.body.address,
            coordinates : [
              parseFloat(req.body.lng),
              parseFloat(req.body.lat)
            ]
          };

          doc
            .save(function(err, hotelUpdated) { //save
                if(err) {
                  res
                    .status(500)
                    .json(err);
                } else {
                  res
                    .status(204)
                    .json();
                } //close else
            }); //close save
          }
      });
   }; //close updateOne

  module.exports.hotelsDeleteOne = function(req, res) {
  var hotelId = req.params.hotelId;

  Hotel
    .findByIdAndRemove(hotelId)
    .exec(function(err, hotel) {
      if (err) {
        res
          .status(404)
          .json(err);
      } else {
        console.log("Hotel deleted, id:", hotelId);
        res
          .status(204)
          .json();
      }
    });
};
