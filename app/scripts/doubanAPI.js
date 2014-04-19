(function () {
	function mixin(src, dest) {
		var keys = Object.keys(src);
		for(var i = 0, len = keys.length; i < len; i++){
			var key = keys[i];
			dest[key] = src[key];
		}
	}
	//var BASE = "http://www.douban.com/j/app/radio/people";
	var BASE = "http://douban.fm/j/mine/playlist";
	var CHANNELS = "http://www.douban.com/j/app/radio/channels";
	var LOGIN = "http://www.douban.com/j/app/login";
	function Douban() {
	}

	var proto = {
		sendRequest: function(config) {
			if(!config) {
				return;
			}
			var req = new XMLHttpRequest();
			req.open(config.type, config.url);
			req.onload = function(e) {
				var response = JSON.parse(req.response);
				config.callback(response);
			};
			req.send(config.data);
		},

		getChannels: function(callback) {
			this.sendRequest({
				type: 'get',
				url: CHANNELS,
				callback: function(response) {
					callback(response.channels);
				}
			});
		},

		getSongs: function(channel ,callback) {
			if(!channel) {
				console.log("Invalid channel, couldn't get songs for it.");
				return;
			}
			var url = BASE + '?token=' + this.token + '&kbps=192&app_name=radio_android&version=584&type=p&channel=' + channel.channel_id + '&preventCache=' + Math.random();
			//var url = BASE + '?kbps=192&from=mainsite&type=n&channel=' + channel.channel_id;
			this.sendRequest({
				type: 'get',
				url: url,
				callback: function(response) {
					callback(response.song);
				}
			});
		},

		login: function(info, callback) {
			if(!(info.username && info.password)) {
				console.log('Invalid login information.');
			}
			var parameters = {
				'app_name': 'radio_android',
				'version': 584,
				'email': info.username,
				'password': info.password
			};
			var data = new FormData();
			for(var key in parameters) {
				data.append(key, parameters[key]);
			}

			this.sendRequest({
				type: 'post',
				url: LOGIN,
				data: data,
				callback: function(response) {
					this.token = response.token;
					callback(response);
				}
			});
		}
	};

	mixin(proto, Douban.prototype);
	window.Douban = Douban;
})();