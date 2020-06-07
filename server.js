const WebSocket = require('ws');
const express = require("express");
const app = express();
const http = require("http");
const bodyParser = require("body-parser");
const yelp = require("yelp-fusion");
const client = yelp.client(process.env.YelpKey);

// make all the files in 'public' available
app.use(express.static("public"));

app.use(bodyParser.json());

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/public/host.html");
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


function generateRandomNumbers(endIndex) {
    let startIndex = 0;
    let result =  Math.floor(Math.random() * (endIndex - startIndex + 1)) + startIndex;
    console.log("First random index is: ", result);
    let secondResult = Math.floor(Math.random() * (endIndex - startIndex + 1)) + startIndex;
    while (secondResult == result) {
      secondResult =  Math.floor(Math.random() * (endIndex - startIndex + 1)) + startIndex;
    }
    console.log("Second random index is: ", secondResult);
    return [result, secondResult];
}

let currentRound = 1;
let tieCounter = 0;

let restaurantList = [];

let totalVoteCounter = [0, 0]
let clientCount = 0;
let voteCount = 1;

let currentVotesCounter = [0, 0];
let currentLeft = 0;
let currentRight = 1;

let leftRightVotes = [0, 0];
let leftVotes = 0;
let rightVotes = 1;

wss.on('connection', (ws) => {
  totalVoteCounter[clientCount] += 1;
  console.log("A new user connected: ", totalVoteCounter[clientCount], "total user(s) connected");

  currentRound = 1;

  tieCounter = 0;

  totalVoteCounter[voteCount] = 0;

  currentVotesCounter[currentLeft] = 0;
  currentVotesCounter[currentRight] = 0;

  leftRightVotes[leftVotes] = 0;
  leftRightVotes[rightVotes] = 0;

  ws.on('message', (message) => {
    let messageJson = JSON.parse(message);
    if (messageJson.type == 'command') {
      //Process the vote
      let vote = messageJson.selection;
      // If the vote is for left
      if (!vote){
        leftRightVotes[leftVotes] = leftRightVotes[leftVotes] + 1;
      // If the vote is for right
      } else {
        leftRightVotes[rightVotes] = leftRightVotes[rightVotes] + 1;
      }
      // After the voting has been registered, increase the amount of votes
      totalVoteCounter[voteCount] = totalVoteCounter[voteCount] + 1;
      // If everyone has voted
      if (totalVoteCounter[voteCount] == totalVoteCounter[clientCount]) {
      // Keep track of indicies
        let winningIndex = 0;
        let losingIndex = 0;
        // If right won
        if (leftRightVotes[rightVotes] > leftRightVotes[leftVotes]) {
          winningIndex = currentVotesCounter[currentRight];
          losingIndex = currentVotesCounter[currentLeft];
        // If left won
      } else if (leftRightVotes[leftVotes] > leftRightVotes[rightVotes]) {
          winningIndex = currentVotesCounter[currentLeft];
          losingIndex = currentVotesCounter[currentRight];
        // If its a tie
        } else {
          // If this is the first tie
          if (!tieCounter) {
            tieCounter++;
            winningIndex = -1;
            losingIndex = -1;
          // If we already have a tie, then randomly select a winner
          } else if (tieCounter) {
            //If this is the second tie, randomly select a winner, and reset the number of rounds tied.
            tieCounter = 0;
            // Randomly get a binary number, and depending on what it is will depend on what the winner is
            let randomWinner = generateRandomNumbers(1);
            console.log("Random pair is: ", randomWinner);
            console.log("Random pair's first index is is: ", randomWinner[0]);
            console.log("Random pair's second index is is: ", randomWinner[1]);
            // If the first index is 0, then right wins
            if (!randomWinner[0]) {
              winningIndex = currentVotesCounter[currentRight];
              losingIndex = currentVotesCounter[currentLeft];
            // If the first index is 1, then left wins
            } else {
              winningIndex = currentVotesCounter[currentLeft];
              losingIndex = currentVotesCounter[currentRight];
            }
          }
        }
        //Reset game
        totalVoteCounter[voteCount] = 0;
        leftRightVotes[leftVotes] = 0;
        leftRightVotes[rightVotes] = 0;

        // Below here to the next comment, is this all
        //If there was a winner, delete the loser
        if (losingIndex > -1) {
          console.log("No tie");
          restaurantList.splice(losingIndex, 1);
        // logging if there was a tie
        } else if (losingIndex < 0) {
          console.log("tie");
        }

        // we sure this is all we need here ^

        let restaurantLength = restaurantList.length;
        console.log("restaurantLength: " + restaurantLength);
        //Broadcast winner if only one resturant left
        if (restaurantLength == 1) {
          broadcast(JSON.stringify({type: "winner", winner: restaurantList[0]}));
          //Otherwise, select the pair for the next round
        } else {

//           why are we incrementing round here ?
          currentRound++;
          let randomNumberPair = generateRandomNumbers(restaurantLength);
          console.log('randomNumberPair: ', randomNumberPair);
          currentVotesCounter[currentLeft] = randomNumberPair[0];
          currentVotesCounter[currentRight] = randomNumberPair[1];
          broadcast(JSON.stringify({ type: "command",
              info: [restaurantList[currentVotesCounter[currentLeft]], restaurantList[currentVotesCounter[currentRight]]],
              round: currentRound}));
        }
      }
    } else if (messageJson.type == "message") { // this is the inital yelp search
      client.search({ term: messageJson.msg[0], location: messageJson.msg[1] }).then(response => {
          for (let i = 0; i < 10; i++) {//storing the top 10 reponses
            restaurantList[i] = JSON.stringify(response.jsonBody.businesses[i], null, 4);
          }
          //Get a random pair of restaurants for the first round]
          let restaurantLength = restaurantList.length;
          let randomNumberPair = generateRandomNumbers(restaurantLength);
          currentVotesCounter[currentLeft] = randomNumberPair[0];
          currentVotesCounter[currentRight] = randomNumberPair[1];

          broadcast(JSON.stringify({ type: "command", //starts the first round of game
          info:  [restaurantList[currentVotesCounter[currentLeft]], restaurantList[currentVotesCounter[currentRight]]],
          round: currentRound }));

        }).catch(e => {console.log(e);});
    }
  });

  ws.on('close', ()=>{
    totalVoteCounter[clientCount] -= 1;
    console.log("One user disconnected: ", totalVoteCounter[clientCount], "total user(s) connected");
  });

  ws.send('Connected!')
})

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

//start our server
server.listen(process.env.PORT, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});
