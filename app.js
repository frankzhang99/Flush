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

var Player = function(id) {
	var self = {};
	self.id = id;
	self.number = Math.floor(10 * Math.random());;

	self.update = function() {
		//TODO
	}


	self.getInitPack = function() {
		return {
			id:self.id,
			number:self.number,
		}
	}
	self.getUpdatePack = function() {
		return {
			id:self.id,
			number:self.number,
		}
	}

	Player.list[id] = self;
	initPack.player.push(self.getInitPack());
	return self;
}
Player.list = {};
Player.onConnect = function(socket){
	var player = Player(socket.id);

	socket.emit('init', {
		selfId:socket.id,
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

var getDeck = function(){
	var deck = new Array();

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

var testdeck = getRandDeck();


var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	socket.on('signIn',function(data){
		if(isValidPassword(data)){
			Player.onConnect(socket);
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
		var playerName = ("" + socket.id).slice(2,7);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat',playerName + ': ' + data);
		}
	});
	
	socket.on('evalServer',function(data){
		if(!DEBUG)
			return;
		var res = eval(data);
		socket.emit('evalAnswer',res);		
	});	


	//game
	// socket.on('startGame')
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




