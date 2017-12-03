var async = require('async');
var moment = require('moment');
var request = require('request');
var express = require('express');

var USER_ID = '9393885'
var CLIENT_ID = '570525846778123c7e477ea11d7d9003';
var CLIENT_ID_APPEND = '?client_id=' + CLIENT_ID;
var SC_URL = 'https://api.soundcloud.com';

// SoundCloud functions
function getSoundCloudCollection(url, callback, collection) {
    console.log("request to: " + url);
    request(url, function(error, response, body) {
        if (error) {
            callback(error);
            return;
        }

        var data = JSON.parse(body);
        var new_collection = data.collection.concat(collection);
        if (data.next_href) {
            getSoundCloudCollection(data.next_href, callback, new_collection);
        } else {
            callback(false, new_collection);
        }
    });
}

function getFollowings(user_id, callback) {
    var url = SC_URL + '/users/' + user_id + '/followings' + CLIENT_ID_APPEND;
    getSoundCloudCollection(url, function(error, followings) {
        if (error) {
            callback(error);
            return;
        }

        var user_ids = followings.map(user => user.id);
        callback(false, user_ids);
    }, []);
}

function isRecent(track) {
    var date = moment().subtract(3, 'days');
    var created_date = moment(track.created_at, 'YYYY/MM/DD HH:mm:ss Z');
    return created_date.isAfter(date);
}

function getRecentTracksForUser(user_id, callback) {
    var url = SC_URL + '/users/' + user_id + '/tracks' + CLIENT_ID_APPEND;
    console.log("request to: " + url);
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
    getFollowings(USER_ID, function(error, results) {
        if (error) {
            callback(error);
            return;
        }

        async.map(results, getRecentTracksForUser, function (error, results) {
            if (error) {
                callback(error);
                return;
            }

            var merged = [].concat.apply([], results);
            callback(false, merged);
        });
    });
}

// Server functions
const app = express();

function get(request, response) {
    getRecentTracks(function(error, tracks) {
        if (error) {
            console.log("Error fetching recent tracks: " + error);
            return;
        }

        response.json(tracks);
    });
}
app.get('/get', get);

function startup() {
    var port = process.env.PORT || 8080;
    app.listen(port);
    console.log("Starting server on port " + port);
}

startup();
