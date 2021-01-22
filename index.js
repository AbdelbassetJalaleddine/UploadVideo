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
  if (req.files) {
    console.log(req.files);
    var file = req.files.file;
    var filename = file.name;
    console.log(filename);
    //hey

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
