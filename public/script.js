// client-side js, loaded by index.html
// run by the browser each time the page is loaded

// When the user hits the share button,
document.querySelector('#startNew').addEventListener('click', () => {
  console.log('LOL');
  //Want to show the link to display the website once the user clicks the submit button    
  let link = document.getElementById("link");
  link.classList.remove("hidden");
});

//when the host presses get resturants we begin
document.querySelector('#begin').addEventListener('click', () => {
  console.log('game start');
  sendNewMsg(); //sends a message to server with category and location
  document.getElementById("invite").textContent="The game has begun. Please exit this tab now! Enjoy the game!";
  //document.location.href =
   //   "https://biblical-beasts-tinder.glitch.me/player.html";
  
});

const url = "wss://biblical-beasts-tinder.glitch.me";
const connection = new WebSocket(url);

//let e = document.getElementById("newMsg");
//e.addEventListener("change", sendNewMsg);

function sendNewMsg() {
  let e = document.getElementById("category");
  let f = document.getElementById("location");
  let msgObj = {
    "type": "message",
    "from": "host",
    "msg": [e.value,f.value]
  }
  connection.send(JSON.stringify(msgObj));
  // e.value = null;
}

let addMessage = function(message) {
  const pTag = document.createElement("p");
  pTag.appendChild(document.createTextNode(message));
  document.getElementById("messages").appendChild(pTag);
};

connection.onopen = () => {
  connection.send(JSON.stringify({"type":"helloHost"}));
};

connection.onerror = error => {
  console.log(`WebSocket error: ${error}`);
};

connection.onmessage = event => {
  let msgObj = JSON.parse(event.data);
  if (msgObj.type == "message") {
    addMessage(msgObj.from+": "+msgObj.msg);
  } else {
    addMessage(msgObj.type);
  }
};

/* 
setInterval(() => {
  let msg = "hearbeat";
  addMessage("host:" + msg)
  connection.send(msg);
}, 4000);
*/
