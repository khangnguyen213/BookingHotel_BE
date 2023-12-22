const { Double } = require("mongodb");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  title: {
    type: String,
    // required: true,
  },
  price: {
    type: Number,
    // required: true,
  },
  maxPeople: {
    type: Number,
    // required: true,
  },
  desc: {
    type: String,
    // required: true,
  },
  roomNumbers: Schema.Types.Array,
});

const hotelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  photos: Schema.Types.Array,
  desc: {
    type: String,
    required: true,
  },
  cheapestPrice: {
    type: Schema.Types.Number,
    required: true,
  },
  rating: {
    type: Schema.Types.Number,
    required: true,
  },
  featured: {
    type: Boolean,
    required: true,
  },
  rooms: [roomSchema],
});

module.exports = mongoose.model("Hotel", hotelSchema);
