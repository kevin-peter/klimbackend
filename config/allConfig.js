
const pool = require("./database");
const fetch = require("node-fetch");

var token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImthYmlyIiwicm9sZSI6MywiaXAiOiI6OjEiLCJpYXQiOjE2ODAwMDI2ODMsImV4cCI6MTcxMTUzODY4M30.cAyLFqwNg3EGOtg1SBK05WguVfU6wg31YmzfWwY5AJw";

module.exports = {
    token,
    lxbook:{
      url: "https://api.1xbook.com/marketprovider/events/detail/",
      token: "",
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4MzY5Iiwicm9sZSI6IkNsaWVudCIsImlzcyI6IlJEUiIsImV4cCI6MTY4MzMxMzU1NjE2MCwicHdkY2giOmZhbHNlLCJpcCI6IjQzLjI0MS4xOTUuMjAxIn0.EeZOVyif9K3phPn_o26yzPkpEOEoiIeVHof245VsuUE'
      }
    },
    ice:{
      //url: "https://api.iceexchange.com/exchange/v1/dashboard/getFancyEventDetails?eventId=",
      url: "http://15.206.197.82:5005/api/v1/event/getApiFancy/",
      
      headers: {
        'host': 'api.iceexchange.com',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
        'access-control-allow-origin': '*',
        'content-type': 'application/json',
        'Origin': 'https://www.iceexch.com',
        'referer': 'https://www.iceexch.com',
        'Sec-Fetch-Mode': 'cors'
	
        
      }
    },
    rama: {
      url: "https://clientapilive.ramaexch.com/api/dashboard-detail/",
      token: "",
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4MzY5Iiwicm9sZSI6IkNsaWVudCIsImlzcyI6IlJEUiIsImV4cCI6MTY4MzMxMzU1NjE2MCwicHdkY2giOmZhbHNlLCJpcCI6IjQzLjI0MS4xOTUuMjAxIn0.EeZOVyif9K3phPn_o26yzPkpEOEoiIeVHof245VsuUE'
      }
    },
    nineexch: {
      url: "https://api.99exch.com/api/client/event/",
      token: "",
      headers: {
        'Authorization': 'bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS45OWV4Y2guY29tL2FwaS9hdXRoIiwiaWF0IjoxNjg0ODQ0MDc0LCJleHAiOjE2ODQ4NjIwNzQsIm5iZiI6MTY4NDg0NDA3NCwianRpIjoiVjc3dmFqSkI3MTNiOXg3MSIsInN1YiI6IjciLCJwcnYiOiI4N2UwYWYxZWY5ZmQxNTgxMmZkZWM5NzE1M2ExNGUwYjA0NzU0NmFhIn0.7duDJDagaChZX4FPitU7OceYj959jonrA7zPCDZdY9I'
      }
    },
    bb: {
      url: "https://famousbet.uk:6100/skyfancy/",
      urlBm: "https://famousbet.uk:6100/skybm/",
      token: "",
      switch: "off",
      headers: {
        'Authorization': ''
      }
    }
  }