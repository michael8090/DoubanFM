(function () {
	function mixin(src, dest) {
		var keys = Object.keys(src);
		for(var i = 0, len = keys.length; i < len; i++){
			var key = keys[i];
			dest[key] = src[key];
		}
	}
	var BASE = "http://www.douban.com/j/app/radio/people";
//	var BASE = "http://douban.fm/j/mine/playlist";
	var CHANNELS = "http://www.douban.com/j/app/radio/channels";
	var LOGIN = "http://www.douban.com/j/app/login";

    function getUrlWidthParams(baseUrl, params) {
        params = params || {};
        var ret = baseUrl + '?',
            keys = Object.keys(params),
            len = keys.length,
            i;
        for (i = 0; i < len; i++) {
            var key = keys[i],
                value = params[key];
            if (value !== undefined) {
                ret += ('&' + key + '=' + value);
            }
        }
        return ret;
    }
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
            var _this = this;
			this.sendRequest({
				type: 'get',
				url: CHANNELS,
				callback: function(response) {
                    if (_this.token) {
                        // the user has logged in, display a red heart channel for him
                        response.channels.splice(0, 0, {
                            seq_id: -3,
                            abbr_en: "",
                            name: "红心兆赫",
                            channel_id: -3,
                            name_en: ""
                        });
                    }
					callback(response.channels);
				}
			});
		},

		getSongs: function(channel ,callback) {
			if(!channel) {
				console.log("Invalid channel, couldn't get songs for it.");
				return;
			}
//            var url = BASE + '?token=' + this.token + '&kbps=192&app_name=radio_android&version=584&type=p&channel=' + channel.channel_id + '&user_id=' + this.userId + '&expire=' + this.expire + '&preventCache=' + Math.random();
//            var url = BASE + '?app_name=radio_desktop_win&version=100&type=n&channel=' + channel.channel_id + '&preventCache=' + Math.random();
            var url = getUrlWidthParams(BASE, {
                app_name: 'radio_desktop_win',
                version: 100,
                type: 'n',
                channel: channel.channel_id,
                token: this.token,
                expire: this.expire,
                user_id: this.userId,
                kbps: 192,
                preventCache: Math.random()
            });

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
				'app_name': 'radio_desktop_win',
				'version': 100,
				'email': info.username,
				'password': info.password
			};
			var data = new FormData();
			for(var key in parameters) {
				data.append(key, parameters[key]);
			}

            var _this = this;
			this.sendRequest({
				type: 'post',
				url: LOGIN,
				data: data,
				callback: function(response) {
                    _this.token = response.token;
                    _this.userName = response['user_name'];
                    _this.userId = response['user_id'];
                    _this.expire = response['expire'];
					callback(response);
				}
			});
		}
	};

	mixin(proto, Douban.prototype);
	window.Douban = Douban;
})();