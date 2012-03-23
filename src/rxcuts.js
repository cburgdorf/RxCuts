(function(){

    var RxCuts = window.RxCuts = { FilterRules: {} };

    RxCuts.FilterRules.NO_CONTROLS = function(event){
        var tagName = (event.target || event.srcElement).tagName;
        return tagName !== 'INPUT' && tagName !== 'SELECT' && tagName !== 'TEXTAREA';
    };

    //Support older Browsers
    if (!Array.indexOf)
    {
        Array.indexOf = [].indexOf ?
            function (arr, obj, from) { return arr.indexOf(obj, from); }:
            function (arr, obj, from) { // (for IE6)
                var l = arr.length,
                    i = from ? parseInt( (1*from) + (from<0 ? l:0), 10) : 0;
                i = i<0 ? 0 : i;
                for (; i<l; i++) {
                    if (i in arr  &&  arr[i] === obj) { return i; }
                }
                return -1;
            };
    }

    function ShortcutInfo(){};
    ShortcutInfo.prototype.areKeysDown = function(keys){
        var shortcutInfo = this;
        var returnInfo;
        Rx.Observable
            .fromArray(keys)
            .aggregate(true,function(acc, i){
                var holdMap = typeof i === "string" ? shortcutInfo.translatedHoldMap : shortcutInfo.holdMap;
                return !acc ? acc : holdMap.indexOf(i) > - 1;
            })
            .subscribe(function(info){
                returnInfo = info;
            });
        return returnInfo;
    };

    ShortcutInfo.prototype.numberOfKeysDown = function(number){
        return this.holdMap.length === number;
    };

    ShortcutInfo.prototype.isProActive = function(){
        return this.lastActivity === "down";
    };

    var keyTranslationMap = {
        8 : "BACKSPACE",
        9 : "TAB",
        13: "ENTER",
        16: "SHIFT",
        17: "CTRL",
        18: "ALT",
        19: "PAUSE",
        20: "CAPS LOCK",
        27: "ESC",
        33: "PAGE UP",
        34: "PAGE DOWN",
        35: "END",
        36: "HOME",
        37: "LEFT ARROW",
        38: "UP ARROW",
        39: "RIGHT ARROW",
        40: "DOWN ARROW"
    }

    var keyCodeSelectorFactory = function(direction){
        return function(event){
            return {
                event: event,
                keyCode: event.keyCode,
                state: direction
            };
        };
    };

    var observableKeyDowns = $(window).keydownAsObservable().select(keyCodeSelectorFactory("down"));
    var observableKeyUps = $(window).keyupAsObservable().select(keyCodeSelectorFactory("up"));

    var createRootObservable = function(filterRules){
        return Rx.Observable
            .merge(null,observableKeyDowns, observableKeyUps)
            .where(function(raw){
                return filterRules(raw.event);
            })
            .scan({}, function(acc, i) {
                acc[i.keyCode] = {
                    state: i.state,
                    timestamp : new Date().getTime()
                };
                acc.lastActivity = i.state;

                return acc;
            })
            .select(function(acc){
                var clonedAcc = $.extend({}, acc);
                var info = new ShortcutInfo();
                info.fullmap = clonedAcc;
                info. holdMap = [];
                info.translatedHoldMap = [];
                info.lastActivity = clonedAcc.lastActivity;

                for (i in clonedAcc){
                    if (clonedAcc[i].state === "down"){
                        info.holdMap.push(i);
                        info.translatedHoldMap.push(keyTranslationMap[i])
                    }
                }
                return info;
            });
    };

    RxCuts.observeShortcuts = function(filterRules){
        filterRules = filterRules || RxCuts.FilterRules.NO_CONTROLS;
        return createRootObservable(filterRules)
    };

})()