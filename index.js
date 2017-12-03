var async = require('async');
var moment = require('moment');
var request = require('request');
var express = require('express');

var client_id = '570525846778123c7e477ea11d7d9003';
var client_id_append = '?client_id=' + client_id;
var sc_url = 'https://api.soundcloud.com';

// SoundCloud functions
function isRecent(track) {
    var date = moment().subtract(100, 'days');
    var created_date = moment(track.created_at, 'YYYY/MM/DD HH:mm:ss Z');
    return created_date.isAfter(date);
}

function getRecentTracksForUser(user_id, callback) {
    var url = sc_url + '/users/' + user_id + '/tracks' + client_id_append;
    request(url, function (error, response, body) {
        if (error) {
            callback(error);
            return;
        }

        var tracks = JSON.parse(body);
        tracks = tracks.filter(isRecent);
        callback(false, tracks);
    });
}

function getRecentTracks(callback) {
    var user_ids = ['27111815', '124158269'];
    async.map(user_ids, getRecentTracksForUser, callback);
}

// Server functions
const app = express();

function startup() {
    console.log("Starting server on port 8080.");
}

function get(request, response) {
    getRecentTracks(function(error, tracks) {
        if (error) {
            console.log("Error fetching recent tracks: " + error);
            return;
        }

        response.json(tracks);
    });
}

app.get('/', get);
app.listen(8080, startup);
