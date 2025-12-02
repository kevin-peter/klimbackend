const createError = require("http-errors");
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const cron = require("node-cron");
const fetch = require("node-fetch");
const conn = require("./config/database");

const indexRouter = require("./routes/index");

const app = express();

app.use(compression());

app.use(cors());

const allEvents = [];
const allEventsRes = [];

cron.schedule("0 0 0 * * *", function () {
  //manageEvents();
  console.log("closed events deleted successfully");
});
const manageEvents = async () => {
  try {
    let allEvents = await fetch(
      "https://famousbet.uk:6100/get_latest_event_list/4",
      {
        headers: {
          redirect: "follow",
        },
      }
    );
    let allEventsRes = await allEvents.json();
    let eids = [];
    for (let i = 0; i < allEventsRes.data.length; i++) {
      eids.push(allEventsRes.data[i].event.id);
    }
    eids = [...new Set(eids)];
    let queryExe =
      "DELETE From `tbl_events` WHERE event_id NOT IN (" + eids.join(",") + ")";
    conn.query(queryExe);
	let queryExe2 =
      "DELETE From `tbl_fancy_runners` WHERE event_id NOT IN (" + eids.join(",") + ")";
    conn.query(queryExe2);
	
    //console.log(eids)
    return true;
  } catch (error) {
    //next(error);
  }
};

// compress responses

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * Shri API v1.0.0
 */
const { routerV1 } = require("./api/v1/routes");

routerV1(app);

app.use("/", indexRouter);

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static("images"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
