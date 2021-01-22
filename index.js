const ffmpeg = require("fluent-ffmpeg");
const ffmpeg_static = require("ffmpeg-static");
const express = require("express");
const upload = require("express-fileupload");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./data.db");

const app = express();

app.use(upload());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/home.html");
});

app.post("/", (req, res) => {
  console.log(req.files);
  console.log(req);
  if (req.files) {
    console.log(req.files);
    var file = req.files.file;
    var filename = file.name;
    console.log(filename);

    //console.log("type", file.type);
    //console.log("size", file.size);

    file.mv("./uploads/videos/" + filename, function (err) {
      writeToDB(filename);
      res.sendFile(__dirname + "/home.html");

      ffmpeg("./uploads/videos/" + filename)
        .setFfmpegPath(ffmpeg_static)
        .screenshots({
          timestamps: [0.9],
          filename: filename + ".png",
          folder: "./uploads/thumbnails/",
        })
        .on("end", function () {
          console.log("done");
        });
      readFromDB();
    });
  }
});

app.listen(5000);

function writeToDB(filename) {
  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS videos (name TEXT,favourites BOOLEAN)");
    var stmt = db.prepare("INSERT INTO videos VALUES (?,?)");
    stmt.run(filename, false);
    stmt.finalize();
  });
}

function readFromDB() {
  db.serialize(function () {
    db.each("SELECT * FROM videos", function (err, row) {
      console.log("Name: " + row.name + "\nFavourites: " + row.favourites);
    });
  });
}

// const buildHairstyleCard = (name, favourites) => {
//   // Create elements needed to build a card
//   const div = document.createElement("div");
//   const h4 = document.createElement("h4");
//   const a = document.createElement("a");
//   const img = document.createElement("img");
//   // Append newly created elements into the DOM
//   const body = document.querySelector("body");
//   body.append(div);
//   h4.append(a);
//   div.append(h4);
//   div.append(img);
//   // Set content and attributes
//   a.innerHTML = name;
//   img.setAttribute("src", "/uploads/thumbnails/" + name + ".png");
//   div.setAttribute("class", "card");
// };

// try {
//   db.serialize(function () {
//     db.each("SELECT * FROM videos", function (err, row) {
//       console.log("Name: " + row.name + "\nFavourites: " + row.favourites);
//       data.forEach((hairstyle) => buildHairstyleCard(row.name, row.favourites));
//     });
//   });
// } catch (error) {
//   console.error(error);
// }
