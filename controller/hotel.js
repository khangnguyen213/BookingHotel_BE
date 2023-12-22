const Hotel = require("../model/hotel");

const getOverview = (req, res, next) => {
  Hotel.find().then((result) => {
    const numberOfHotelByCity = (city) => {
      return result.filter((hotel) => hotel.city === city).length;
    };
    const numberOfHotelByType = (type) => {
      return result.filter((hotel) => hotel.type === type).length;
    };
    const ratingSortedList = result.sort((a, b) => b.rating - a.rating);
    const respond = {
      numberOfHotelInDN: numberOfHotelByCity("Da Nang"),
      numberOfHotelInHCM: numberOfHotelByCity("Ho Chi Minh"),
      numberOfHotelInHN: numberOfHotelByCity("Ha Noi"),
      numberOfHotel: numberOfHotelByType("hotel"),
      numberOfApartment: numberOfHotelByType("apartment"),
      numberOfResort: numberOfHotelByType("resort"),
      numberOfVilla: numberOfHotelByType("villa"),
      numberOfCabin: numberOfHotelByType("cabin"),
      topRatedHotel: [
        ratingSortedList[0],
        ratingSortedList[1],
        ratingSortedList[2],
      ],
    };
    res.send(respond);
  });
};

exports.getOverview = getOverview;
