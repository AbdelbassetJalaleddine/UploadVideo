const ffmpeg = require("fluent-ffmpeg");
const ffmpeg_static = require("ffmpeg-static");
const express = require("express");
const upload = require("express-fileupload");
const { JSDOM } = require("jsdom");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database("./data.db");
global.document = new JSDOM("./home.html").window.document;
const app = express();

// app.use(express.static("public"));
// app.use(express.static("files"));

// app.use("/uploads/thumbnails", express.static("public"));
// app.use("/uploads/thumbnails", express.static("files"));

app.use(express.static("public"));
app.use(express.static("uploads"));

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

    console.log("type", file.type);
    console.log("size", file.size);

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
      buildHairstyleCard(row.name, row.favourites);
    });
  });
}

function buildHairstyleCard(name, favourites) {
  // Create elements needed to build a card
  try {
    const div = document.createElement("div");
    const img = document.createElement("img");
    // Append newly created elements into the DOM
    const body = document.querySelector("body");
    body.append(div);
    div.append(img);
    // Set content and attributes
    img.setAttribute("src", "./uploads/thumbnails/" + name + ".png");
    img.setAttribute("width", "200px");
    img.setAttribute("height", "200px");

    console.log("/uploads/thumbnails/" + name + ".png");
    div.setAttribute("class", "card");
  } catch (error) {
    console.error(error);
  }
}

readFromDB();
