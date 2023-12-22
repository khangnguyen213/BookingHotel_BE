const express = require("express");

const cors = require("cors");

const app = express();

const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const User = require("./model/user");
const Hotel = require("./model/hotel");
const Transaction = require("./model/transaction");

const userController = require("./controller/user");
const hotelController = require("./controller/hotel");

app.use(cors());

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));

//GET USER LIST
app.get("/user", userController.getUser);

//LOGIN
app.post("/login", userController.postLogin);

//REGISTER
app.post("/register", userController.postRegister);

//GET OVERVIEW DATA
app.get("/overview", hotelController.getOverview);

//GET HOTEL LIST
app.get("/hotel", (req, res, next) => {
  Hotel.find()
    .then((arr) => res.send(arr))
    .catch((err) => console.log(err));
});

//GET HOTEL BY ID
app.get("/hotels/:hotelId", (req, res, next) => {
  Hotel.find({ _id: req.params.hotelId })
    .then((result) => res.send(result))
    .catch((err) => {
      console.log(err);
    });
});

//ADD HOTEL
app.post("/add-hotel", userController.authenticateUser, (req, res, next) => {
  const hotelInformation = {
    name: req.body.name,
    title: req.body.title,
    type: req.body.type,
    city: req.body.city,
    address: req.body.address,
    distance: req.body.distance,
    photos: req.body.photos,
    desc: req.body.desc,
    cheapestPrice: req.body.cheapestPrice,
    rating: req.body.rating,
    featured: req.body.featured,
    rooms: req.body.rooms,
  };
  const hotel = new Hotel(hotelInformation);
  hotel
    .save()
    .then((hotel) => {
      return res.send(hotel);
    })
    .catch((err) => console.log(err));
});

//DELETE HOTEL
app.post(
  "/delete-hotel",
  userController.authenticateUser,
  (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(404).send("You don't have permission");
    }
    const today = new Date();
    Transaction.find({ hotel: req.body.hotelId }).then((transactions) => {
      if (transactions.every((transaction) => transaction.dateEnd < today)) {
        next();
      } else {
        return res.status(404).send("Hotel has already booked in near future");
      }
    });
  },
  (req, res, next) => {
    Hotel.findByIdAndDelete(req.body.hotelId, function (err, docs) {
      if (err) {
        console.log(err);
      } else {
        console.log("Deleted : ", docs);
        return res.send("Deleted Hotel");
      }
    });
  }
);

//ADD ROOM
app.post("/add-room", userController.authenticateUser, (req, res, next) => {
  Hotel.findById(req.body.hotelId).then((hotel) => {
    const roomDetail = {
      desc: req.body.desc,
      title: req.body.title,
      price: req.body.price,
      roomNumbers: req.body.roomNumbers,
      maxPeople: req.body.maxPeople,
    };
    hotel.rooms.push(roomDetail);
    hotel
      .save()
      .then((hotel) => {
        return res.send(hotel);
      })
      .catch((err) => console.log(err));
  });
});

//DELETE ROOM
app.post(
  "/delete-room",
  userController.authenticateUser,
  (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(404).send("You don't have permission");
    }
    const today = new Date();
    Transaction.find({ hotel: req.body.hotelId }).then((transactions) => {
      const newArr = transactions.filter((transaction) => {
        return transaction.roomNumbers.some((roomNumber) =>
          req.body.roomNumbers.includes(roomNumber)
        );
      });
      if (newArr.length === 0) {
        next();
      } else {
        if (newArr.every((transaction) => transaction.dateEnd < today)) {
          next();
        } else {
          return res
            .status(404)
            .send("Hotel has already booked in near future");
        }
      }
    });
  },
  (req, res, next) => {
    Hotel.findById(req.body.hotelId).then((hotel) => {
      hotel.rooms.id(req.body.roomId).remove();
      hotel
        .save()
        .then((hotel) => {
          return res.send(hotel);
        })
        .catch((err) => console.log(err));
    });
  }
);

//ADD TRANSACTION
app.post(
  "/add-transaction",
  userController.authenticateUser,
  (req, res, next) => {
    Hotel.findById(req.body.hotelId)
      .then((hotel) => {
        if (!hotel) {
          throw new Error("Hotel not found");
        }
        console.log(req.body);
        const transactionDetail = {
          user: req.user,
          hotel: hotel,
          roomNumbers: req.body.roomNumbers,
          dateStart: new Date(req.body.date[0].startDate),
          dateEnd: new Date(req.body.date[0].endDate),
          price: req.body.price,
          method: req.body.method,
        };

        const transaction = new Transaction(transactionDetail);
        transaction.save().then((user) => {
          user.populate("user", "hotel").then((user) => res.send(user));
        });
      })
      .catch((err) => console.log(err.toString()));
  }
);

app.post(
  "/all-transactions",
  userController.authenticateUser,
  (req, res, next) => {
    console.log(req.user);
    if (!req.user.isAdmin) {
      return res
        .status(404)
        .send("You need permission to access this database");
    } else {
      Transaction.find()
        .populate("hotel user")
        .then((transactions) => {
          console.log(transactions);
          return res.send(transactions);
        })
        .catch((err) => console.log(err));
    }
  }
);

app.post(
  "/find-transaction-by-user",
  userController.authenticateUser,
  (req, res, next) => {
    Transaction.find({ user: req.user })
      .populate("hotel")
      .then((transactions) => {
        console.log(transactions);
        return res.send(transactions);
      })
      .catch((err) => console.log(err));
  }
);

app.post("/search", async (req, res, next) => {
  try {
    const destination = req.body.destination;
    const numberOfPeople =
      Math.floor(req.body.options.adult ? req.body.options.adult : 1) +
      Math.floor(req.body.options.children ? req.body.options.children / 2 : 0);
    const numberOfRoom = req.body.options.room;
    const startDate = new Date(req.body.date[0].startDate);
    const endDate = new Date(req.body.date[0].endDate);
    const minPrice = req.body.options.minPrice ? +req.body.options.minPrice : 0;
    const maxPrice = req.body.options.maxPrice
      ? +req.body.options.maxPrice
      : 99999;

    //Hotel.find({city}) => hotelArr (1)
    const suitableHotels = await Hotel.find(
      destination ? { city: destination } : {}
    ).then((hotelArr1) => {
      if (hotelArr1.length === 0 || !hotelArr1) {
        return [];
      }
      //=> Filter from list of hotel for price between min and max price => hotelArr (2)
      const hotelArr2 = hotelArr1.filter((hotel) => {
        return (
          hotel.cheapestPrice >= minPrice && hotel.cheapestPrice <= maxPrice
        );
      });

      if (hotelArr2.length === 0 || !hotelArr2) {
        return [];
      }

      //filter list of hotel (2) which have [numberOfRoom] able to contain [numberOfPeople]
      //for example 1 room for a total of 3 people or 2 room for a total of 5 people

      const hotelArr3 = hotelArr2.filter((hotel) => {
        let people = 0;
        for (let i = 0; i <= numberOfRoom; i++) {
          if (hotel.rooms[i]) {
            people += hotel.rooms[i].maxPeople;
          }
        }
        return people >= numberOfPeople;
      });

      //check hotelArr3
      if (hotelArr3.length === 0 || !hotelArr3) {
        return [];
      }

      return hotelArr3;
    });
    const transactionArr = await Transaction.find();
    const result = suitableHotels.map((hotel) => {
      let roomList = [];
      let bookedRoomList = [];
      hotel.rooms.forEach((room) => {
        roomList = roomList.concat(room.roomNumbers);
      });
      transactionArr
        .filter((transaction) => {
          const bookedStart = new Date(transaction.dateStart);
          const bookedEnd = new Date(transaction.dateEnd);
          if (transaction.hotel.toString() !== hotel._id.toString()) {
            return false;
          }
          return (
            (bookedStart <= startDate && startDate <= bookedEnd) ||
            (bookedStart <= endDate && endDate <= bookedEnd)
          );
        })
        .forEach((transaction) => {
          bookedRoomList = bookedRoomList.concat(transaction.roomNumbers);
        });
      const availableRoomList = roomList.filter(
        (room) => !bookedRoomList.includes(room)
      );

      return { ...hotel._doc, availableRoomList };
    });

    return res.send(result);
  } catch (err) {
    console.log(err);
  }
});

app.post("/check-hotel-available/:hotelId", async (req, res, next) => {
  try {
    const startDate = new Date(req.body.date[0].startDate);
    const endDate = new Date(req.body.date[0].endDate);

    const searchedHotel = await Hotel.findById(req.params.hotelId);
    const suitableHotels = [searchedHotel];
    const transactionArr = await Transaction.find();
    const result = suitableHotels.map((hotel) => {
      let roomList = [];
      let bookedRoomList = [];
      hotel.rooms.forEach((room) => {
        roomList = roomList.concat(room.roomNumbers);
      });
      transactionArr
        .filter((transaction) => {
          const bookedStart = new Date(transaction.dateStart);
          const bookedEnd = new Date(transaction.dateEnd);
          if (transaction.hotel.toString() !== hotel._id.toString()) {
            return false;
          }
          return (
            (bookedStart <= startDate && startDate <= bookedEnd) ||
            (bookedStart <= endDate && endDate <= bookedEnd)
          );
        })
        .forEach((transaction) => {
          bookedRoomList = bookedRoomList.concat(transaction.roomNumbers);
        });
      const availableRoomList = roomList.filter(
        (room) => !bookedRoomList.includes(room)
      );

      return { ...hotel._doc, availableRoomList };
    });

    return res.send(result);
  } catch (err) {
    console.log(err);
  }
});

mongoose
  .connect(
    "mongodb+srv://khangnguyen:140202@cluster0.btdla2l.mongodb.net/booking?retryWrites=true&w=majority"
  )
  .then((result) => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
