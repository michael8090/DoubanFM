(function () {
    function mixin(src, dest) {
        var keys = Object.keys(src);
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            dest[key] = src[key];
        }
    }

    var BASE = "http://www.douban.com/j/app/radio/people";
    //	var BASE = "http://douban.fm/j/mine/playlist";
    var CHANNELS = "http://www.douban.com/j/app/radio/channels";
    var LOGIN = "http://www.douban.com/j/app/login";

    //for 163
//    var SEARCH163 = 'http://music.163.com/api/search/get/web';
    var SEARCH163 = 'http://music.163.com/api/search/suggest/web?csrf_token=';
//    var SEARCH163 = 'http://music.163.com/api/search/get/';
    var DETAIL163 = 'http://music.163.com/api/song/detail';
    var REFERER163 = 'http://music.163.com';

    /*
     类型	需要参数	含义	报告长度
     b	sid	bye，不再播放	短报告
     e	sid	end，当前歌曲播放完毕，但是歌曲队列中还有歌曲	短报告
     n		new，没有歌曲播放，歌曲队列也没有任何歌曲，需要返回新播放列表	长报告
     p		playing，歌曲正在播放，队列中还有歌曲，需要返回新的播放列表
     r	sid	rate，歌曲正在播放，标记喜欢当前歌曲	短报告
     s	sid	skip，歌曲正在播放，队列中还有歌曲，适用于用户点击下一首	短报告
     u	sid	unrate，歌曲正在播放，标记取消喜欢当前歌曲	短报告
     其中，p报告可以附上h参数，表示最近播完的歌的信息。
     */

    var SONG_REPORT_TYPES = {
        BYE: 'b',
        END: 'e',
        NEW: 'n',
        PLAYING: 'p',
        SKIP: 's',
        RATE: 'r',
        UNRATE: 'u'
    };

    function mergeParams (params) {
        params = params || {};
        var ret = '',
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
        return ret.substring(1, ret.length);
    }

    function getUrlWidthParams(baseUrl, params) {
        return baseUrl + '?' + mergeParams(params);
    }

    var ITEM_KEYS = ['token', 'userName', 'userId', 'expire'];

    function Douban() {
    }

    var proto = {
        sendRequest: function (config) {
            if (!config) {
                return;
            }
            var req = new XMLHttpRequest();
            req.open(config.type, config.url);
            req.onload = function (e) {
                var response = JSON.parse(req.response);
                config.callback(response);
            };

            if (config['Content-type']) {
                req.setRequestHeader("Content-type", config['Content-type']);
            }
            req.send(config.data);
        },

        getChannels: function (callback) {
            var _this = this;
            this.sendRequest({
                type: 'get',
                url: CHANNELS,
                callback: function (response) {
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

        requestSongs: function (params, callback) {
            params = params || {};
            var defaultParams = {
                app_name: 'radio_desktop_win',
                version: 100,
                type: SONG_REPORT_TYPES.NEW,
                //                channel: channel.channel_id,
                token: this.token,
                expire: this.expire,
                user_id: this.userId,
                kbps: 192,
                preventCache: Math.random()
            };
            mixin(params, defaultParams);
            params = defaultParams;

            var url = getUrlWidthParams(BASE, params),
                _this = this;

            this.sendRequest({
                type: 'get',
                url: url,
                callback: function (response) {
                    callback(response.song);
                    var songs = response.song || [],
                        len = songs.length,
                        i;
                    for(i = 0; i < len; i++) {
                        (function(song) {
                            _this.search(song, function(response) {
                                var j, rsongs = response.code === 200 && response.result && response.result.songs || [],
                                    lr = rsongs.length,
                                    matchedSong ;
                                for (j = 0; j < lr && !matchedSong; j++) {
                                    var s = rsongs[j];
                                    if (s) {
                                        if (s.name === song.title && s.artists) {
                                            var as = s.artists,
                                                la = as.length,
                                                k;
                                            for (k = 0; k < la; k ++){
                                                var ta = as[k];
                                                if (ta.name === song.artist) {
                                                    matchedSong = s;
//                                                    console.log("getcha!");
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (matchedSong) {
                                    _this.sendRequest({
                                        type: 'get',
                                        url: getUrlWidthParams(DETAIL163, {
                                            ids: '[' + matchedSong.id + ']'
                                        }),
                                        callback: function(response) {
                                            if (response.code === 200) {
                                                var hQSong = response.songs && response.songs[0];
//                                                if (hQSong  && !song.isPlaying) { //don't need to check the isPlaying, as it will not trigger a change in the view
                                                if (hQSong && hQSong.mp3Url) {
                                                    song.url = hQSong.mp3Url;
                                                    song.isHightQuality = true;
                                                    callback([song]);
                                                }
                                            }
                                        }
                                    });
                                }
                            });
                        })(songs[i]);
                    }
                }
            });
        },

        getSongs: function (channel, callback) {
            if (!channel) {
                console.log("Invalid channel, couldn't get songs for it.");
                return;
            }
            this.requestSongs({
                channel: channel.channel_id,
                type: SONG_REPORT_TYPES.NEW
            }, callback);
        },

        reportSong: function (song, channel, type, callback) {
            if (!song) {
                return;
            }
            this.requestSongs({
                channel: channel.channel_id,
                sid: song.sid,
                type: type
            }, callback);
        },

        rate: function (song, channel, callback) {
            this.reportSong(song, channel, SONG_REPORT_TYPES.RATE, callback);
        },

        unRate: function (song, channel, callback) {
            this.reportSong(song, channel, SONG_REPORT_TYPES.UNRATE, callback);
        },

        dislike: function (song, channel, callback) {
            this.reportSong(song, channel, SONG_REPORT_TYPES.BYE, callback);
        },

        skip: function (song, channel, callback) {
            this.reportSong(song, channel, SONG_REPORT_TYPES.SKIP, callback);
        },

        end: function (song, channel, callback) {
            this.reportSong(song, channel, SONG_REPORT_TYPES.END, callback);
        },

        login: function (info, callback) {
            if (!(info.username && info.password)) {
                console.log('Invalid login information.');
            }
            var parameters = {
                'app_name': 'radio_desktop_win',
                'version': 100,
                'email': info.username,
                'password': info.password
            };
            var data = new FormData();
            for (var key in parameters) {
                data.append(key, parameters[key]);
            }

            var _this = this;
            this.sendRequest({
                type: 'post',
                url: LOGIN,
                data: data,
                callback: function (response) {
                    _this.token = response.token;
                    _this.userName = response['user_name'];
                    _this.userId = response['user_id'];
                    _this.expire = response['expire'];
                    _this.storeUserSession();
                    callback(response);
                }
            });
        },

        logout: function (callback) {
            this.token = undefined;
            this.userName = undefined;
            this.userId = undefined;
            this.expire = undefined;
            this.clearUserSession();
        },

        storeUserSession: function () {
            var session = {};
            for (var i = 0, len = ITEM_KEYS.length; i < len; i++) {
                var key = ITEM_KEYS[i];
                session[key] = this[key];
            }
            chrome.storage.sync.set(session);
        },

        loadUserSession: function (callback) {
            var _this = this;
            chrome.storage.sync.get(ITEM_KEYS, function (result) {
                for (var i = 0, len = ITEM_KEYS.length; i < len; i++) {
                    var key = ITEM_KEYS[i];
                    _this[key] = result[key];
                }
                if (callback) {
                    callback(result);
                }
            });
        },

        clearUserSession: function () {
            chrome.storage.sync.clear();
        },

        testUserSession: function (callback) {
            var _this = this;
            this.loadUserSession(function () {
                if (_this.token) {
                    _this.getSongs({channel_id: -3}, function (songs) {
                        var isValid = songs && songs.length > 0;
                        callback(isValid);
                    });
                } else {
                    callback(false);
                }
            });
        },

        search: function (song, callback) {
//            chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
//                var header = '';
//            }, {urls: ['*:music.163.com/*']});
//            document.cookie = 'appver=1.5.2';
            this.sendRequest({
                url: SEARCH163,
                type: 'POST',
                'Content-type': "application/x-www-form-urlencoded",
                data: mergeParams({
                    type: 1,
                    s: song.title + ' ' + song.artist,
                    limit: 20,
                    offset: 0,
//                    csrf_token: '',
                    hlpretag: '',
                    hlposttag: ''
                }),
                callback: callback
            })
        }
    };

    mixin(proto, Douban.prototype);
    window.Douban = Douban;

//    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
//        var header = '';
//    }, {urls: ['*:music.163.com/*']});

    //    var rule163 = {
//        conditions: [
//            new chrome.declarativeWebRequest.RequestMatcher({
//                url: { hostSuffix: 'music.163.com' }
//            })
//        ],
//        actions: [
//            chrome.declarativeWebRequest.SetRequestHeader('Referer', REFERER163)
//        ]
//    };
//    chrome.declarative.onBeforeSendHeaders.addRules([rule163]);

})();