function fmCtrl($scope) {
	var douban = new Douban(),
        maxSongNumber = 50;

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


    var getCurrentChanel = function() {
        return $scope.channelMap[$scope.currentChannelId];
    };

    var setCurrentChanel = function(channel) {
        if (!channel) {
            return ;
        }
        $scope.currentChannelId = channel[CHANNEL_ID_KEY];
        $scope.currentChannelIndex = $scope.channels.indexOf(channel);
    };

    var getCurrentSong = function() {
        return $scope.songMap[$scope.currentSongId];
    };

    var setCurrentSong = function(song) {
        if (!song) {
            return ;
        }
        $scope.currentSongId = song[SONG_ID_KEY];
        $scope.currentSongIndex = $scope.songs.indexOf(song);
    };

    var checkChannelAndSong = function () {
        if (!getCurrentChanel()) {
            setCurrentChanel($scope.channels[0]);
        }
        if (!getCurrentSong()) {
            setCurrentSong($scope.songs[0]);
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

	$scope.getSongs = function(channel, callback) {
		for(var i = 0; i < 5; i++){
			douban.getSongs(channel, function(songs) {
				$scope.$apply(function() {
					if(!(songs instanceof Array)) {
						return ;
					}
                    //try to clear the old list
                    var k,
                        sl = songs.length;
                    for(k = 0; k < sl; k++) {
                        var song = songs[k];
                        if ($scope.songMap[song[SONG_ID_KEY]] === undefined) {
                            $scope.songMap[song[SONG_ID_KEY]] = song;
                            $scope.songs.push(song);
                        }
                    }
                    var exceedLength = Math.min($scope.songs.length - maxSongNumber, $scope.currentSongIndex);
                    if (exceedLength > 0) {
                        var removedSongs = $scope.songs.splice(0, exceedLength),
                            j,
                            rl = removedSongs.length;
                        for(j = 0; j < rl; j++) {
                            $scope.songMap[removedSongs[j]] = undefined;
                        }
                        setCurrentSong($scope.songs[$scope.currentSongId]);
                    }
                    checkChannelAndSong();
                    if (callback) {
                        callback(songs);
                    }
					console.log("Current Song kbps: " + getCurrentSong().kbps);
				});
			});
		}
	};

	$scope.getChannels(function() {
        $scope.getSongs(getCurrentChanel());
    });

	$scope.$watch("currentChannelId", function() {
		$scope.songs = [];
        $scope.songMap = {};
		$scope.getSongs(getCurrentChanel());
	});

	$scope.playNextSong = function() {
		$scope.$apply(function() {
            var nextSong = $scope.songs[$scope.currentSongIndex + 1];
            if (nextSong) {
                setCurrentSong(nextSong);
            } else {
                $scope.getSongs(getCurrentChanel(), function() {
                    var nextSong = $scope.songs[$scope.currentSongIndex + 1];
                    if (nextSong === undefined) {//it happens when the channel has no new song
                        nextSong = $scope.songs[Math.floor(Math.random() * $scope.songs)];
                    }
                    setCurrentSong(nextSong)
                });
            }
		});
	};

	$scope.player = document.getElementById("player");
	if($scope.player) {
		$scope.player.addEventListener("ended",$scope.playNextSong);
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


}