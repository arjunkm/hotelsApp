var mongoose = require('mongoose');

var reviewSchema = mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  rating : {
    type : Number,
    min : 0,
    max : 5,
    required : true
  },
  review : {
    type : String,
    required : true
  },
  createdOn : {
    type : Date,
    "default" : Date.now
  }

}, {usePushEach: true});

var roomSchema = mongoose.Schema({
  type : String,
  number : Number,
  description : String,
  photos : [String],
  price : Number
});

//name - path, string - Schema type
var hotelSchema = new mongoose.Schema({
  name : {
    type : String,
    required : true
  },
  stars : {
    type : Number,
    min : 0,
    max : 5,
    "default" : 0
  },
  services : [String],
  description : String,
  photos : [String],
  currency : String,
  reviews : [reviewSchema],
  rooms : [roomSchema],
  location : {
    address : String,
    //store coordinates in longitude-latitude order
    coordinates : {
      type : [Number],
      index : '2dsphere'
    }
  }
});

mongoose.model('Hotel', hotelSchema, 'hotels'); // name of model, name of schema, name of mongoDB collection (optional)
