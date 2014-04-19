function fmCtrl($scope) {
	var douban = new Douban();

	$scope.channels = [];
	$scope.songs = [];
	$scope.showLoginDialog = 'hide';

	$scope.getChannels = function() {
		douban.getChannels(function(channels) {
			$scope.$apply(function() {
				$scope.channels = channels;
				$scope.currentChannel = channels[0];
				$scope.currentChannelIndex = 0;
				$scope.getSongs($scope.currentChannel);
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
					$scope.songs = $scope.songs.concat(songs);
					$scope.currentSong = songs[0];
					console.log("Current Song kbps: " + $scope.currentSong.kbps);
					$scope.currentSongIndex = 0;
				});
			});
		}
	};

	$scope.getChannels();

	$scope.$watch("currentChannelIndex", function(index) {
		$scope.currentChannel = $scope.channels[index];
		//$scope.songs = [];
		$scope.getSongs($scope.currentChannel);
	});

	$scope.playNextSong = function() {
		$scope.$apply(function() {
			var songs = $scope.songs,
				channels = $scope.channels,
				sl = songs.length,
				cl = channels.length;
			var currentSongIndex = parseInt($scope.currentSongIndex, 10),
				currentChannelIndex = $scope.currentChannelIndex;
			var nextSongIndex = currentSongIndex + 1;
			if(nextSongIndex >= sl) {
				$scope.getSongs($scope.currentChannel);
			} else {
				$scope.currentSongIndex = nextSongIndex;
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
				$scope.showLoginDialog = 'hide';
			});
		});
	};


}