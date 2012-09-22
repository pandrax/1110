#!/usr/bin/env node

"use strict";

var maxClients = 20,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer( {host: '0.0.0.0', port: 8080}),
    clients = {}, clientData = {}, nextId = 1;

function sendOne (clientId, data) {
    var json = JSON.stringify(data);
    try {
        clients[clientId].send(json);
    } catch (e) {
        console.log("Failed to send to client ID " + clientId);
    }
}

function sendAll (data) {
    var json = JSON.stringify(data);
    for (var i in clients) {
        try {
            clients[i].send(json);
        } catch (e) {
            console.log("Failed to send to client ID " + i);
        }
    }
}

wss.on('connection', function(client) {
    var numClients = Object.keys(clients).length+1;

    if (numClients > maxClients) {
        client.close(1008, "Too many clients, try again later");
        return;
    }

    var clientId = nextId;
    nextId++;
  
    clients[clientId] = client;
    clientData[clientId] = {};
    console.log("New client ID: " + clientId);
    console.log("Current number of clients: " + numClients);

    sendOne(clientId, {"id": clientId});
    sendAll({"all": clientData});

    client.on('close', function() {
        console.warn("Client ID " + clientId + " disconnected");
        delete clients[clientId];
        delete clientData[clientId];
        console.log("Current number of clients: " + Object.keys(clients).length);
        sendAll({"delete": clientId});
    });

    client.on('message', function(message) {
        var data;
        //console.log("Received message from client ID " + clientId + ": " + message);
        try {
            data = JSON.parse(message);
        } catch (e) {
            console.error("failed to parse message: " + message);
        }
        clientData[clientId] = data;
        var obj = {};
        obj[clientId] = data;
        sendAll({"change": obj});
    });
});

