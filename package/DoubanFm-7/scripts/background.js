"use strict";chrome.app.runtime.onLaunched.addListener(function(){var a=500,b=300;chrome.app.window.create("index.html",{id:"main",bounds:{width:a,height:b,left:Math.round((screen.availWidth-a)/2),top:Math.round((screen.availHeight-b)/2)}})});