function fmCtrl($scope) {
    var douban = new Douban(),
        maxSongNumber = 200;

    $scope.channels = [];
    $scope.channelMap = {};
    $scope.songs = [];
    $scope.songMap = {};
    $scope.currentChannelIndex = -1;
    $scope.currentChannelId = '';
    $scope.currentSongIndex = -1;
    $scope.currentSongId = '';
    $scope.showLoginDialog = 'hide';
    $scope.isLoggedIn = false;
    $scope.userName = '';
    $scope.loginError = '';

    var CHANNEL_ID_KEY = 'channel_id',
        SONG_ID_KEY = 'sid';

    $scope.getCurrentChannel = function () {
        return $scope.channelMap[$scope.currentChannelId];
    };

    $scope.setCurrentChanel = function (channel) {
        if (!channel) {
            return;
        }
        $scope.currentChannelId = channel[CHANNEL_ID_KEY];
        $scope.currentChannelIndex = $scope.channels.indexOf(channel);
    };

    $scope.getCurrentSong = function () {
        return $scope.songMap[$scope.currentSongId];
    };

    $scope.setCurrentSong = function (song) {
        if (!song) {
            return;
        }
        $scope.currentSongId = song[SONG_ID_KEY];
        $scope.currentSongIndex = $scope.songs.indexOf(song);
        var songInputNode = document.getElementById('song-' + $scope.currentSongIndex);
        if (songInputNode) {
            songInputNode.parentNode.scrollIntoViewIfNeeded(true);
        }
    };

    var checkChannelAndSong = function () {
        if (!$scope.getCurrentChannel()) {
            $scope.setCurrentChanel($scope.channels[0]);
        }
        if (!$scope.getCurrentSong()) {
            $scope.setCurrentSong($scope.songs[0]);
        }
    };

    var getMap = function (array, key) {
        var len = array.length,
            i,
            ret = {};
        for (i = 0; i < len; i++) {
            ret[array[i][key]] = array[i];
        }
        return ret;
    };

    $scope.isPlaying = function (item) {
        return item === $scope.getCurrentChannel() || item === $scope.getCurrentSong();
    };

    $scope.getChannels = function (callback) {
        douban.getChannels(function (channels) {
            $scope.$apply(function () {
                $scope.channels = channels;
                $scope.channelMap = getMap(channels, CHANNEL_ID_KEY);
                checkChannelAndSong();
                if (callback) {
                    callback(channels);
                }
            });
        });
    };

    $scope.addSongs = function (songs, needsExclude) {
        if (!(songs instanceof Array)) {
            return;
        }
        var k,
            sl = songs.length;
        for (k = 0; k < sl; k++) {
            var song = songs[k],
                existedSong = $scope.songMap[song[SONG_ID_KEY]];
            if (existedSong === undefined && song.adtype === undefined) {// remove the adds
                $scope.songMap[song[SONG_ID_KEY]] = song;
                $scope.songs.push(song);
            }
            //let it to be in the $scope, the changed model should update the view automatically
            //            else {
            //                if (song.url) {
            //                    existedSong.url = song.url;
            //                }
            //                existedSong.isHightQuality = song.isHightQuality;
            //            }
        }
        if (needsExclude) {
            var exceedLength = Math.min($scope.songs.length - maxSongNumber, $scope.currentSongIndex);
            if (exceedLength > 0) {
                var removedSongs = $scope.songs.splice(0, exceedLength),
                    j,
                    rl = removedSongs.length;
                for (j = 0; j < rl; j++) {
                    $scope.songMap[removedSongs[j]] = undefined;
                }
                $scope.setCurrentSong($scope.songs[$scope.currentSongId]);
            }
        }
    };

    $scope.getSongs = function (channel, callback) {
        douban.getSongs(channel, function (songs) {
            $scope.$apply(function () {

                //try to clear the old list
                $scope.addSongs(songs, true);
                checkChannelAndSong();
                if (callback) {
                    callback(songs);
                }
                //                console.log("Current Song kbps: " + $scope.getCurrentSong().kbps);
            });
        });
    };

    douban.testUserSession(function (isValid) {
        if (isValid) {
            $scope.$apply(function () {
                console.log('yes we logged in');
                $scope.userName = douban.userName;
                $scope.showLoginDialog = 'hide';
                $scope.isLoggedIn = true;
            });
        } else {
            douban.clearUserSession();
        }
    });

    $scope.$watch("currentChannelId", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.songs = [];
            $scope.songMap = {};
            var newChannel = $scope.channelMap[newValue];

            $scope.setCurrentChanel(newChannel);
            $scope.getSongs(newChannel);
        }
    });

    $scope.$watch("currentSongId", function (newValue, oldValue) {
        if (newValue !== oldValue) {
            var newSong = $scope.songMap[newValue];
            $scope.setCurrentSong(newSong);
        }
    });

	$scope.shareSong = function (index) {
		var linkUrl = 'http://service.weibo.com/share/share.php?title={{TITLE}} http://douban.fm/?start={{START_ID}}&pic={{PICTURE}}';
		var song = $scope.songs[index];
		if (song) {
			var url = linkUrl.replace('{{TITLE}}', '分享来自' + song.artist + '的' + song.title)
				.replace('{{PICTURE}}', song.picture)
				.replace('{{START_ID}}', song.sid + 'g' + song.ssid + 'g0');
			window.open(url, '_blank', 'width=800,height=600,location=0');
		}
	};

    $scope.getChannels(function () {
        $scope.getSongs($scope.getCurrentChannel());
    });

    $scope.playSong = function (index) {
        var nextSong = $scope.songs[index];
        if (nextSong) {
            $scope.setCurrentSong(nextSong);
        } else {
            $scope.getSongs($scope.getCurrentChannel(), function () {
                var nextSong = $scope.songs[index];
                if (nextSong === undefined) {//it happens when the channel has no new song
                    nextSong = $scope.songs[Math.floor(Math.random() * $scope.songs)];
                }
                $scope.setCurrentSong(nextSong);
            });
        }
    };

    $scope.playNextSong = function () {
        $scope.playSong($scope.currentSongIndex + 1);
    };

    $scope.playLastSong = function () {
        var index = $scope.currentSongIndex - 1;
        if (index < 0) {
            index = $scope.songs.length + index;
        }
        $scope.playSong(index);
    };

    var reportSongCallback = function (songs) {
        $scope.$apply(function () {
            $scope.addSongs(songs);
        });
    };

    $scope.rate = function () {
        var song = $scope.getCurrentSong(),
            channel = $scope.getCurrentChannel();
        if (!song) {
            return;
        }
        var isLiked = !parseInt(song['like'], 10);
        song.like = isLiked ? 1 : 0;
        if (isLiked) {
            douban.rate(song, channel, reportSongCallback);
        } else {
            douban.unRate(song, channel, reportSongCallback);
        }
    };

    $scope.skip = function () {
        douban.skip($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

    $scope.dislike = function () {
        douban.dislike($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

    $scope.end = function () {
        douban.end($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

    $scope.player = document.getElementById("player");
    if ($scope.player) {
        $scope.player.addEventListener("ended", function () {
            $scope.$apply(function () {
                $scope.end();
            });
        });
    }

    $scope.login = function () {
        var info = {
            username: $scope.username,
            password: $scope.password
        };
        douban.login(info, function (response) {
            $scope.$apply(function () {
                if (response.err !== 'ok') {
                    $scope.loginError = response.err;
                    console.log("Login failed: " + response.err);
                    return;
                }

                $scope.userName = response['user_name'];
                $scope.showLoginDialog = 'hide';
                $scope.isLoggedIn = true;
                $scope.loginError = '';
                $scope.getChannels();
            });
        });
    };

    $scope.logout = function () {
        douban.logout();
        $scope.userName = '';
        $scope.loginError = '';
        $scope.isLoggedIn = false;
        $scope.getChannels();
    };

    document.body.onkeydown = function (e) {
        if (e.ctrlKey) {
            switch (e.keyCode) {
            case 37: //left
                $scope.$apply(function () {
                    $scope.playLastSong();
                });
                break;
            case 39: //right
                $scope.$apply(function () {
                    $scope.playNextSong();
                });
                break;
            default:
                break;
            }
        }
    };
}
fmCtrl.$inject = ['$scope'];
var fm = angular.module('fm', [])
//    .run(function ($scope, $anchorScroll, $location) {
//        $anchorScroll.yOffset = '50%';
//    })
    .controller('fmCtrl', fmCtrl);
