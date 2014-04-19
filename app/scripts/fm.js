function fmCtrl($scope) {
	var douban = new Douban();

	$scope.channels = [];
	$scope.songs = [];

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
					$scope.songs = songs;
					$scope.currentSong = songs[0];
					$scope.currentSongIndex = 0;
				});
			});
		}
	};

	$scope.getChannels();

	$scope.$watch("currentChannelIndex", function(index) {
		$scope.currentChannel = $scope.channels[index];
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
				// Issue: cannot play the next song automatically
				// var player = $scope.player;
				// player.pause();
				// player.src = songs[$scope.currentSongIndex].url;
				// player.play();
			}

		});
	};

	$scope.player = document.getElementById("player");
	if($scope.player) {
		$scope.player.addEventListener("ended",$scope.playNextSong);
	}

	// $scope.$watch("currentSongName", function(name) {
	// 	var ss = $scope.songs,
	// 		len = ss && ss.length;
	// 	for(var i = 0; i < len; i++) {
	// 		var song = ss[i];
	// 		if(song.title === name) {
	// 			$scope.currentSong = song;
	// 		}
	// 	}
	// });

	// $scope.$watch("currentSong", function(song) {
	// 	if(!song) {
	// 		return;
	// 	}
	// 	var player = document.getElementById("player");
	// 	var source = player.firstChild;
	// 	var newSource = document.createElement("source");
	// 	player.pause();
	// 	player.src = song.url;
	// 	newSource.src = song.url;
	// 	//player.replaceChild(newSource, source);
	// 	player.play();
		// var newPlayer = document.createElement("audio");
		// newPlayer.src = song.url;
		// newPlayer.setAttribute("controls","");
		// newPlayer.setAttribute("autoplay", "");
		// player.parentNode.replaceChild(newPlayer, player);
	//});





	//$scope.songs = [{name:"test", url:"http://mr4.douban.com/201305262116/82db01a921aa0d7d22024bed821a8203/view/song/small/p1394944.mp3"}];
	//$scope.currentSong = $scope.songs[0];
}