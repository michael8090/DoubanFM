function fmCtrl($scope) {
	var douban = new Douban(),
        maxSongNumber = 50;

	$scope.channels = [];
	$scope.songs = [];
    $scope.currentChannelIndex = 0;
    $scope.currentSongIndex = 0;
	$scope.showLoginDialog = 'hide';
    $scope.isLoggedIn = false;
    $scope.userName = '';

    var getCurrentChanel = function() {
        return $scope.channels[$scope.currentChannelIndex];
    };

    var getCurrentSong = function() {
        return $scope.songs[$scope.currentSongIndex];
    };

    var checkChanelAndSong = function () {
        if (!getCurrentChanel() || !getCurrentSong()) {
            $scope.currentChannelIndex = 0;
            $scope.currentSongIndex = 0;
        }
    };


	$scope.getChannels = function() {
		douban.getChannels(function(channels) {
			$scope.$apply(function() {
				$scope.channels = channels;
                checkChanelAndSong();
                $scope.currentSongIndex = 0;
				$scope.getSongs(getCurrentChanel());
			});
		});
	};

	$scope.getSongs = function(channel) {
		for(var i = 0; i < 5; i++){
			douban.getSongs(channel, function(songs) {
				$scope.$apply(function() {
					if(!(songs instanceof Array)) {
						return ;
					}
                    //try to clear the old list
                    var exceedLength = Math.min($scope.songs.length + songs.length - maxSongNumber, $scope.currentSongIndex);
                    if (exceedLength > 0) {
                        $scope.songs.splice(0, exceedLength);
                        $scope.currentSongIndex -= exceedLength;
                    }
					$scope.songs = $scope.songs.concat(songs);
                    checkChanelAndSong();
					console.log("Current Song kbps: " + getCurrentSong().kbps);
				});
			});
		}
	};

	$scope.getChannels();

	$scope.$watch("currentChannelIndex", function(index) {
		$scope.songs = [];
        $scope.currentSongIndex = 0;
		$scope.getSongs(getCurrentChanel());
	});

	$scope.playNextSong = function() {
		$scope.$apply(function() {
            $scope.currentSongIndex ++;
			if($scope.currentSongIndex >= $scope.songs.length) {
				$scope.getSongs(getCurrentChanel());
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
				douban.token = response.token;
                douban.userName = response['user_name'];
                douban.userId = response['user_id'];
                douban.expire = response['expire'];

                $scope.userName = response['user_name'];
                $scope.showLoginDialog = 'hide';
                $scope.isLoggedIn = true;
                $scope.getChannels();
			});
		});
	};


}