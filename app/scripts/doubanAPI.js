(function () {
	function mixin(src, dest) {
		var keys = Object.keys(src);
		for(var i = 0, len = keys.length; i < len; i++){
			var key = keys[i];
			dest[key] = src[key];
		}
	}
	var BASE = "http://www.douban.com/j/app/radio/people";
	var CHANNELS = "http://www.douban.com/j/app/radio/channels";
	function Douban() {
	}

	var proto = {
		getChannels: function(callback) {
			var req = new XMLHttpRequest();
			req.open('get', CHANNELS);
			req.onload = function(e) {
				var response = JSON.parse(req.response);
				callback(response.channels);
			};
			req.send();
		},

		getSongs: function(channel ,callback) {
			if(!channel) {
				console.log("Invalid channel, couldn't get songs for it.");
				return;
			}
			var req = new XMLHttpRequest();
			var url = BASE + '?app_name=radio_desktop_win&version=100&type=n&channel=' + channel.channel_id;
			req.open('get',url);
			req.onload = function(e) {
				var response = JSON.parse(req.response);
				callback(response.song);
			};
			req.send();
		}
	};

	mixin(proto, Douban.prototype);
	window.Douban = Douban;
})();