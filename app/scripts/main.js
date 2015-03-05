'use strict';

// Listens for the app launching then creates the window
chrome.app.runtime.onLaunched.addListener(function () {
    var width = 800;
    var height = 600;

    chrome.app.window.create('index.html', {
        id: 'main',
        //frame: {type: 'none'},
        bounds: {
            width: width,
            height: height,
            left: Math.round((screen.availWidth - width) / 2),
            top: Math.round((screen.availHeight - height) / 2)
        }
    });
});

chrome.commands.onCommand.addListener(function (command) {
    var view = chrome.app.window.getAll()[0];
    if (view) {
        var window = view.contentWindow,
            $scope = window.angular.element(window.document).scope();
        switch (command) {
        case 'playNextSong':
            $scope.$apply(function () {
                $scope.playNextSong();
            });
            break;
        case 'playLastSong':
            $scope.$apply(function () {
                $scope.playLastSong();
            });
            break;
        case 'rate':
            $scope.$apply(function () {
                $scope.rate();
            });
            break;
        case 'dislike':
            $scope.$apply(function () {
                $scope.dislike();
            });
            break;
        default :
            break;
        }
    }
});
