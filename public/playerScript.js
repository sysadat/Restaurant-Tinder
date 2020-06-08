// client-side js, loaded by index.html
// run by the browser each time the page is loaded

const url = "wss://biblical-beasts-tinder.glitch.me";
const connection = new WebSocket(url);

let progressBar = document.getElementById("progress"); // THE BAR THAT SAYS WAITING....
let gameboard = document.getElementById("tournament"); //DISPLAYS FOR BOTH RESTURANTS
let name1 = document.getElementById("name"); //name of left resturant
let name2 = document.getElementById("name2"); //name of right resturant
let price1 = document.getElementById("price"); //price of left resturant
let price2 = document.getElementById("price2"); //price of right resturant
let image1 = document.getElementById("Image"); //image of left resturant
let image2 = document.getElementById("Image2"); //image of right resturant
let rating1 = document.getElementById("rating"); //rating of left resturant
let rating2 = document.getElementById("rating2"); //rating of right resturant
let address1 = document.getElementById("address"); //address of left resturant
let address2 = document.getElementById("address2"); //address of right resturant
let heart1 = document.getElementById("heart"); //the heart/like button
let heart2 = document.getElementById("heart2"); //the heart/like button
let roundNumber = document.getElementById("roundNumber"); // Keep track and update the current round 


function sendNewMsg() {
  let e = document.getElementById("newMsg");
  let msgObj = {
    "type": "message",
    "from": "a client",
    "msg": e.value
  }
  connection.send(JSON.stringify(msgObj));
  e.value = null;
}

let addMessage = function(message) {
  const pTag = document.createElement("p");
  pTag.appendChild(document.createTextNode(message));
  document.getElementById("messages").appendChild(pTag);
};


connection.onopen = () => {
  connection.send(JSON.stringify({"type": "helloClient"}));
};

connection.onerror = error => {
  console.log(`WebSocket error: ${error}`);
};


connection.onmessage = event => {
  console.log(event.data);
  let msgObj = JSON.parse(event.data);
  if (msgObj.type == "message") {
    addMessage(msgObj.from+": "+msgObj.msg);
  } 
  else if (msgObj.type == "winner") {
    progressBar.textContent = "Winner!";
    let winnerInfo = JSON.parse(msgObj.winner);
    updateDisplay(winnerInfo,winnerInfo);
  }
  else if (msgObj.type == "fail") {
    progressBar.textContent = "NO RESTAURANTS FOUND, PLEASE CLOSE ALL TABS AND START OVER!";
  }
  else if (msgObj.type == "command") {
    progressBar.textContent = "Please vote ..."
    roundNumber.textContent = "Round: "+ msgObj.round;
    roundNumber.classList.remove("hidden");
    gameboard.classList.remove("hidden");
    updateDisplay(JSON.parse(msgObj.info[0]), JSON.parse(msgObj.info[1]));
  } else {
      addMessage(msgObj.type);
  }
};

heart1.addEventListener("click", () => {
  progressBar.textContent = "Waiting...";
  let cmdObj = {
    "type": "command",
    "selection": 0
  }
  connection.send(JSON.stringify(cmdObj));
});

heart2.addEventListener("click", () => {
  progressBar.textContent = "Waiting...";
  let cmdObj = {
    "type": "command",
    "selection": 1
  }
  connection.send(JSON.stringify(cmdObj));
});

function updateDisplay(leftYelp, rightYelp) {
    name1.innerHTML= leftYelp.name;
    name2.innerHTML= rightYelp.name;
    price1.innerHTML = leftYelp.price;
    price2.innerHTML = rightYelp.price;
    image1.style.background= "url("+leftYelp.image_url+")";
    image2.style.background= "url("+rightYelp.image_url+")";
    let leftStars = rating1.children;
    let rightStars = rating2.children;
    for (let i = 0; i < leftStars.length; i++) {
      if (i < Math.round(leftYelp.rating)) {
        leftStars[i].className = "fas fa-star";
      } else {
        leftStars[i].className = "far fa-star";
      }
      if (i < Math.round(rightYelp.rating)) {
        rightStars[i].className = "fas fa-star";
      } else {
        rightStars[i].className = "far fa-star";
      }
    }
    address1.textContent= leftYelp.location.address1+", "+leftYelp.location.city+", "+leftYelp.location.state+" "+leftYelp.location.zip_code;
    address2.textContent= rightYelp.location.address1+", "+rightYelp.location.city+", "+rightYelp.location.state+" "+rightYelp.location.zip_code;

  
}

