const WebSocket = require('ws');
const axios = require("axios");
const express = require("express");
const app = express();
const http = require("http");
const assets = require("./assets");
const yelp = require('yelp-fusion');



// const client_id = "WRqfH7snIv6eOysP3lAOSg";
// const api_key = "M8wBkwMZd5PypvgDI7i2UkZoqLRmvf1sV145-Pbf7psMiEuZJS8VN12Rjmgxea8NJCkK4cVcUTWYGQjVu6Avri41NcGjcS8GGCyfdmHR8DTyGbnmNMB9v54eVvvXXnYx";
// cleaner version
const apiKey = yelp.client(process.env.YELPAPIKEY);
const clientID = yelp.client(process.env.CLIENTID);


// Gain access to SVGs in the assets
app.use("/assets", assets);

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public")); 

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/host.html");
});

const server = http.createServer(app);

const wss = new WebSocket.Server({server});


// REST
let yelpREST = axios.create({
  baseURL: "https://api.yelp.com/v3/",
  headers: {
    Authorization: `Bearer ${process.env.API_KEY}`,
    "Content-type": "application/json",
  },
})


const restaurantList = [["AAA", "BBB"], ["CCC", "DDD"], ["EEE", "FFF"], ["GGG", "HHH"]];
let clientCount = 0;
let voteCount = 0;
let restaurantIndex = 0;

yelpREST('/businesses/search', { params: { 'location': 'Davis', 'categories':  "chinese", 'limit': 16 } }).then(({ data }) => {
    data.businesses.forEach((item)=>{
      console.log(item);
    })
})

wss.on('connection', (ws) => {
  clientCount += 1;
  restaurantIndex = 0;
  console.log("a new user connected --", clientCount, "users connected");
  ws.on('message', (message) => {
    // console.log(message)
    //ws.send("server echo:" + message);
    //broadcast(message)
    let cmdObj = JSON.parse(message);
    if (cmdObj.type == 'command')
    {
      console.log("one user selected restaurant", restaurantList[restaurantIndex][cmdObj.selection]);
      voteCount += 1;
      if (voteCount == clientCount)
      {
          voteCount = 0;
          if (restaurantIndex < restaurantList.length - 1)
            restaurantIndex += 1;  
          let nrObj = {'type': 'command', 'info': restaurantList[restaurantIndex]}
          
          broadcast(JSON.stringify(nrObj));
      }
    }
    
    
  })
  
  ws.on('close', ()=>{
    clientCount -= 1;
    console.log("a user disconnected --", clientCount, "users connected");
  });
  
  ws.send('connected!')
})

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Random String Generator, creates a random 21 character string
function randomStringGenerator() {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  let result = '';
  for ( let i = 0; i < 21; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

//start our server
server.listen(process.env.PORT, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});