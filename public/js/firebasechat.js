// var firebase = require("firebase");
var config = {
  apiKey: "AIzaSyAP6WPHg0JFVDClh5hGPMX6tVT2xYmyx_0",
  authDomain: "hivemind-2017.firebaseapp.com",
  databaseURL: "https://hivemind-2017.firebaseio.com",
  projectId: "hivemind-2017",
  storageBucket: "hivemind-2017.appspot.com",
  messagingSenderId: "665654390800"
};
firebase.initializeApp(config); 

 // CREATE A REFERENCE TO FIREBASE
var messagesRef = new Firebase('https://hivemind-2017.firebaseio.com');

// REGISTER DOM ELEMENTS
var messageField = $('#messageInput');
var nameField = $('#nameInput');
// var messageList = $('#example-messages');
var messageList = document.getElementById('example-messages');

// LISTEN FOR KEYPRESS EVENT
messageField.keypress(function (e) {
  if (e.keyCode == 13) {
    //FIELD VALUES
    var username = nameField.val();
    var message = messageField.val();

    //SAVE DATA TO FIREBASE AND EMPTY FIELD
    messagesRef.push({name:username, text:message});
    messageField.val('');
  }
});

// Add a callback that is triggered for each chat message.
messagesRef.limitToLast(10).on('child_added', function (snapshot) {
  //GET DATA
  var data = snapshot.val();
  var username = data.name || "anonymous";
  var message = data.text;

  //CREATE ELEMENTS MESSAGE & SANITIZE TEXT
  var messageElement = $("<li>");
  var nameElement = $("<strong class='example-chat-username'></strong>")
  nameElement.text(username);
  messageElement.text(message).prepend(nameElement);

  console.log(messageList.value)

  //ADD MESSAGE
  messageElement.appendChild(messageElement)

  //SCROLL TO BOTTOM OF MESSAGE LIST
  messageElement[0].scrollTop = $('example-messages').scrollHeight;
});

firebase.auth().signInAnonymously().catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
});
