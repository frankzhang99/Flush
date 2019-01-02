//var mongojs = require("mongojs");
var db = null;//mongojs('localhost:27017/myGame', ['account','progress']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client',express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);
console.log("Server started.");

var SOCKET_LIST = {};

var Player = function(id, name) {
	var self = {};
	self.id = id;
	self.number = Math.floor(10 * Math.random());;
	self.name = name;
	self.numCards = 4;


	self.update = function() {
		//TODO
	}


	self.getInitPack = function() {
		return {
			id:self.id,
			name:self.name,
			numCards:self.numCards,
		}
	}
	self.getUpdatePack = function() {
		return {
			id:self.id,
			name:self.name,
			numCards:self.numCards,
		}
	}

	Player.list[id] = self;
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};
Player.onConnect = function(socket, name){
	var player = Player(socket.id, name);

	socket.emit('init', {
		selfId:socket.id,
		selfName:name,
		player:Player.getAllInitPack(),
	})
}
Player.getAllInitPack = function() {
	var players = [];
	for(var i in Player.list)
		players.push(Player.list[i].getInitPack());
	return players;
}

Player.onDisconnect = function(socket) {
	delete Player.list[socket.id];
	removePack.player.push(socket.id);
}

Player.update = function() {
	var pack = [];
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push(player.getUpdatePack());
	}
	return pack;
}

var DEBUG = true;
var namepass = {
	"frank":"frank",
	"william":"william",
	"chuwei":"chuwei",
	"sai":"sai",
	"eric":"eric",
}


var isValidPassword = function(data){
	return true;
	// return namepass[data.username] === data.password;
}
var isUsernameTaken = function(data){
	return false;
}
var addUser = function(data){

}

//the card game
var SUITS = ["spades", "diamonds", "clubs", "hearts"];
var VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

var getValue = function(card){
	if(card.value === "K"){
		if(card.suit === "spades" || card.suit === "clubs")
			return 30;
		else
			return -1;
	} else if (card.value === "Q"){
		return 12;
	} else if (card.value === "J"){
		return 11;
	} else if (card.value === "A"){
		return 1;
	} else {
		return parseInt(card.value);
	}
}

var getDeck = function(){
	var deck = [];

	for(var i = 0; i < SUITS.length; i++)
	{
		for(var x = 0; x < VALUES.length; x++)
		{
			var card = {value: VALUES[x], suit: SUITS[i]};
			deck.push(card);
		}
	}

	return deck;
}

var getRandDeck = function () {
	var deck = getDeck();

	// for 1000 turns
	// switch the values of two random cards
	for (var i = 0; i < 1000; i++)
	{
		var location1 = Math.floor((Math.random() * deck.length));
		var location2 = Math.floor((Math.random() * deck.length));	
		var tmp = deck[location1];
		deck[location1] = deck[location2];
		deck[location2] = tmp;
	}

	return deck;
}

//game deck and discard pile
var deck;
var discard;
var orderedPlayers;
var playerHands;
var inGame;
var flushCalled;

var newGame = function() {
	//reset decks
	deck = getRandDeck();
	discard = [];
	orderedPlayers = [];
	playerHands = [];
	inGame = true;
	flushCalled = false;
	//establish player order
	for(var i in Player.list)
		orderedPlayers.push(Player.list[i]);
	//deal cards
	for(i = 0; i < orderedPlayers.length; i++) {
		var player = orderedPlayers[i];
		var cards = [];
		for(j = 0; j < player.numCards; j++)
			cards.push(deck.pop());
		playerHands.push(cards);
	}
};



var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	socket.on('signIn',function(data){
		if(isValidPassword(data)){
			Player.onConnect(socket, data.username);
			socket.emit('signInResponse',{success:true});
		} else {
			socket.emit('signInResponse',{success:false});	
		}
	});
	socket.on('signUp',function(data){
		if(isUsernameTaken(data)){
			socket.emit('signUpResponse',{success:false});	
		} else {
			socket.emit('signUpResponse',{success:true});
		}	
	});
	
	
	socket.on('disconnect',function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	socket.on('sendMsgToServer',function(data){
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',data.name + ': ' + data.msg);
		}
	});
	
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);		
	});	


	//game
	socket.on('startGame', function() {
		console.log("Game Start");
		newGame();
	});
	socket.on('randomPack', function() {
		
	})

});


var initPack = {player:[]};
var removePack = {player:[]};






setInterval(function() {
	var pack = {
		player:Player.update(),
	}

	for(var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i];
		socket.emit('init', initPack);
		socket.emit('update', pack);
		socket.emit('remove', removePack);
	}
	initPack.player = [];
	removePack.player = [];

},1000/25);




