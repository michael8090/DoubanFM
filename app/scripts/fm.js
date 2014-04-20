
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

    var CHANNEL_ID_KEY = 'channel_id',
        SONG_ID_KEY = 'sid';


    $scope.getCurrentChannel = function() {
        return $scope.channelMap[$scope.currentChannelId];
    };

    $scope.setCurrentChanel = function(channel) {
        if (!channel) {
            return ;
        }
        $scope.currentChannelId = channel[CHANNEL_ID_KEY];
        $scope.currentChannelIndex = $scope.channels.indexOf(channel);
    };

    $scope.getCurrentSong = function() {
        return $scope.songMap[$scope.currentSongId];
    };

    $scope.setCurrentSong = function(song) {
        if (!song) {
            return ;
        }
        $scope.currentSongId = song[SONG_ID_KEY];
        $scope.currentSongIndex = $scope.songs.indexOf(song);
    };

    var checkChannelAndSong = function () {
        if (!$scope.getCurrentChannel()) {
            $scope.setCurrentChanel($scope.channels[0]);
        }
        if (!$scope.getCurrentSong()) {
            $scope.setCurrentSong($scope.songs[0]);
        }
    };

    var getMap = function(array, key) {
        var len = array.length,
            i,
            ret = {};
        for(i = 0; i < len; i++) {
            ret[array[i][key]] = array[i];
        }
        return ret;
    };


	$scope.getChannels = function(callback) {
		douban.getChannels(function(channels) {
			$scope.$apply(function() {
				$scope.channels = channels;
                $scope.channelMap = getMap(channels, CHANNEL_ID_KEY);
                checkChannelAndSong();
                if (callback) {
                    callback(channels);
                }
            });
		});
	};

    $scope.addSongs = function(songs, needsExclude) {
        if(!(songs instanceof Array)) {
            return ;
        }
        var k,
            sl = songs.length;
        for(k = 0; k < sl; k++) {
            var song = songs[k];
            if ($scope.songMap[song[SONG_ID_KEY]] === undefined) {
                $scope.songMap[song[SONG_ID_KEY]] = song;
                $scope.songs.push(song);
            }
        }
        if (needsExclude) {
            var exceedLength = Math.min($scope.songs.length - maxSongNumber, $scope.currentSongIndex);
            if (exceedLength > 0) {
                var removedSongs = $scope.songs.splice(0, exceedLength),
                    j,
                    rl = removedSongs.length;
                for(j = 0; j < rl; j++) {
                    $scope.songMap[removedSongs[j]] = undefined;
                }
                $scope.setCurrentSong($scope.songs[$scope.currentSongId]);
            }
        }
    };

	$scope.getSongs = function(channel, callback) {
//		for(var i = 0; i < 5; i++){
			douban.getSongs(channel, function(songs) {
				$scope.$apply(function() {

                    //try to clear the old list
                    $scope.addSongs(songs, true);
                    checkChannelAndSong();
                    if (callback) {
                        callback(songs);
                    }
					console.log("Current Song kbps: " + $scope.getCurrentSong().kbps);
				});
			});
//		}
	};

    douban.testUserSession(function(isValid) {
        if (isValid) {
            $scope.$apply(function() {
                console.log('yes we logged in');
                $scope.userName = douban.userName;
                $scope.showLoginDialog = 'hide';
                $scope.isLoggedIn = true;
            });
        } else {
            douban.clearUserSession();
        }
    });

	$scope.$watch("currentChannelId", function(newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.songs = [];
            $scope.songMap = {};
            $scope.getSongs($scope.getCurrentChannel());
        }
	});

    $scope.$watch("currentSongId", function(newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.setCurrentSong($scope.songMap[newValue]);
//            $scope.getSongs($scope.getCurrentChanel());
        }
    });

    $scope.getChannels(function() {
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
                $scope.setCurrentSong(nextSong)
            });
        }
    };

    $scope.playNextSong = function() {
        $scope.playSong($scope.currentSongIndex + 1);
    };

    $scope.playLastSong = function() {
        var index = $scope.currentSongIndex - 1;
        if (index < 0) {
            index = $scope.songs.length + index;
        }
        $scope.playSong(index);
    };

    var reportSongCallback = function(songs) {
        $scope.$apply(function() {
            $scope.addSongs(songs);
        });
    };

    $scope.rate = function() {
        var song = $scope.getCurrentSong(),
            channel = $scope.getCurrentChannel();
        if (!song) {
            return ;
        }
        var isLiked = !parseInt(song['like'], 10);
        song.like = isLiked ? 1 : 0;
        if (isLiked) {
            douban.rate(song, channel, reportSongCallback);
        } else {
            douban.unRate(song, channel, reportSongCallback);
        }
    };

    $scope.skip = function() {
        douban.skip($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

    $scope.dislike = function() {
        douban.dislike($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

    $scope.end = function() {
        douban.end($scope.getCurrentSong(), $scope.getCurrentChannel(), reportSongCallback);
        $scope.playNextSong();
    };

	$scope.player = document.getElementById("player");
	if($scope.player) {
		$scope.player.addEventListener("ended",function() {
            $scope.$apply(function() {
                $scope.end();
            });
        });
	}

	$scope.login = function() {
		var info = {
			username: $scope.username,
			password: $scope.password
		};
		douban.login(info, function(response) {
			$scope.$apply(function() {
				if(response.err !== 'ok') {
					console.log("Login failed: " + response.err);
					return ;
				}

                $scope.userName = response['user_name'];
                $scope.showLoginDialog = 'hide';
                $scope.isLoggedIn = true;
                $scope.getChannels();
			});
		});
	};

    $scope.logout = function() {
        douban.logout();
        $scope.userName = '';
        $scope.isLoggedIn = false;
        $scope.getChannels();
    }


}
fmCtrl.$inject = ['$scope'];
var fm = angular.module('fm', []);
fm.controller('fmCtrl', fmCtrl);
