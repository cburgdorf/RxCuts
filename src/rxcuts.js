(function () {

    var RxCuts = window.RxCuts = { FilterRules: {} },
        index = 0, keyStates = {};

    RxCuts.FilterRules.NO_CONTROLS = function (event) {
        var tagName = (event.target || event.srcElement).tagName;
        return tagName !== 'INPUT' && tagName !== 'SELECT' && tagName !== 'TEXTAREA';
    };

    //Support older Browsers
    if (!Array.indexOf) {
        Array.indexOf = [].indexOf ?
            function (arr, obj, from) { return arr.indexOf(obj, from); } :
            function (arr, obj, from) { // (for IE6)
                var l = arr.length,
                    i = from ? parseInt((1 * from) + (from < 0 ? l : 0), 10) : 0;
                i = i < 0 ? 0 : i;
                for (; i < l; i++) {
                    if (i in arr && arr[i] === obj) { return i; }
                }
                return -1;
            };
    }

    function isArray(a) {
        return Object.prototype.toString.apply(a) === '[object Array]';
    }

    function ShortcutInfo() { };
    ShortcutInfo.prototype.areKeysDown = function (keys, matchesOrder) {

        if(!isArray(keys)) throw "parameter keys should be an array of keys"

        var shortcutInfo = this,
            returnInfo,
            currentIndex = index;
        Rx.Observable
            .fromArray(keys)
            .aggregate({matchesAll: true, lastIndex: currentIndex, isInOrder: true, isFirst : true}, function (acc, i) {

                //The lookup array can be either an array of keycodes or keynames depending on the input
                var holdMap = typeof i === "string" ? shortcutInfo.translatedHoldMap : shortcutInfo.holdMap,
                    //the index of the key found in the lookup array
                    indexInHoldMap = holdMap.indexOf(i),
                    //no matter if we started with the keycode or the name, let's further use the keycode internally
                    keyCode = shortcutInfo.holdMap[indexInHoldMap],
                    //let's get the "event index" for the specific keycode
                    indexOfKey = keyCode !== undefined ? shortcutInfo.fullmap[keyCode].index : -1;

                //keep it false if it already was false, otherwise set it false if the key wasn't found in the holdmap
                acc.matchesAll = !acc.matchesAll ? false : indexInHoldMap > -1;

                //keep it false if it already was false, otherwise set it false if either
                //the key wasn't found in holdmap at all
                //or the "event index" doesn't directly follow the preceding event index
                acc.isInOrder = (!acc.isInOrder || indexInHoldMap === -1) ? false :
                                acc.isFirst ? true : indexOfKey === acc.lastIndex + 1;

                //save the event index of the matched key as lastIndex for the next aggregation step
                acc.lastIndex = indexOfKey;
                acc.isFirst = false;
                return acc;
            })
            .subscribe(function (info) {
                returnInfo = info;
            });
        return !matchesOrder ? returnInfo.matchesAll : returnInfo.matchesAll && returnInfo.isInOrder;
    };

    ShortcutInfo.prototype.numberOfKeysDown = function (number) {
        return this.holdMap.length === number;
    };

    ShortcutInfo.prototype.isActive = function () {
        return this.lastActivity === "down";
    };

    ShortcutInfo.prototype.isPassive = function(){
        return !this.isActive();
    };

    var keyTranslationMap = {
        8: "BACKSPACE", 9: "TAB", 13: "ENTER", 16: "SHIFT", 17: "CTRL", 18: "ALT", 19: "PAUSE BREAK",
        20: "CAPS LOCK", 27: "ESCAPE", 33: "PAGE UP", 34: "PAGE DOWN", 35: "END", 36: "HOME", 37: "LEFT ARROW",
        38: "UP ARROW", 39: "RIGHT ARROW", 40: "DOWN ARROW", 45: "INSERT", 46: "DELETE", 48: "0", 49: "1", 50: "2",
        51: "3", 52: "4", 53: "5", 54: "6", 55: "7", 56: "8", 57: "9", 65: "A", 66: "B", 67: "C", 68: "D", 69: "E",
        70: "F", 71: "G", 72: "H", 73: "I", 74: "J", 75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P", 81: "Q",
        82: "R", 83: "S", 84: "T", 85: "U", 86: "V", 87: "W", 88: "X", 89: "Y", 90: "Z", 91: "LEFT WINDOW KEY",
        92: "RIGHT WINDOW KEY", 93: "SELECT KEY", 96: "NUMPAD 0", 97: "NUMPAD 1", 98: "NUMPAD 2", 99: "NUMPAD 3",
        100: "NUMPAD 4", 101: "NUMPAD 5", 102: "NUMPAD 6", 103: "NUMPAD 7", 104: "NUMPAD 8", 105: "NUMPAD 9",
        106: "MULTIPLY", 107: "ADD", 109: "SUBTRACT", 110: "DECIMAL POINT", 111: "DIVIDE", 112: "F1", 113: "F2",
        114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11",
        123: "F12", 144: "NUM LOCK", 145: "SCROLL LOCK", 186: "SEMI COLON", 187: "EQUAL SIGN", 188: "COMMA",
        189: "DASH", 190: "PERIOD", 191: "FORWARD SLASH", 192: "GRAVE ACCENT", 219: "OPEN BRACKET", 220: "BACKSLASH",
        221: "CLOSEBRACKET", 222: "SINGLE QUOTE"
    };

    var keyCodeSelectorFactory = function (direction) {
        return function (event) {
            return {
                event: event,
                keyCode: event.keyCode,
                state: direction
            };
        };
    };

    function getInputStreams(){
        return {
            observableKeyDowns : RxCuts.ObservableKeydown || Rx.Observable.fromEvent(window, 'keydown'),
            observableKeyUps :RxCuts.ObservableKeyup || Rx.Observable.fromEvent(window, 'keyup')
        }
    }

    var createRootObservable = function (filterRules) {

        var inputStreams = getInputStreams();

        return Rx.Observable
            .merge(null, inputStreams.observableKeyDowns.select(keyCodeSelectorFactory("down")), inputStreams.observableKeyUps.select(keyCodeSelectorFactory("up")))
            .doAction(function(info) {
                index++;
                keyStates[info.keyCode] = {
                    state: info.state,
                    timestamp: new Date().getTime(),
                    index: index
                };
            })
            .where(function(current) {
                return filterRules(current.event);
            })
            .select(function(current) {
                var info = new ShortcutInfo();
                info.fullmap = keyStates;
                info.holdMap = [];
                info.translatedHoldMap = [];
                info.lastActivity = current.state;

                for (i in keyStates) {
                    if (keyStates[i].state === "down") {
                        info.holdMap.push(i);
                        info.translatedHoldMap.push(keyTranslationMap[i]);
                    }
                }
                return info;
            });

    };

    //Make current state resetable (for testing)
    RxCuts.resetState = function(){
        keyStates = {};
    };

    RxCuts.observeShortcuts = function (filterRules) {
        filterRules = filterRules || RxCuts.FilterRules.NO_CONTROLS;
        return createRootObservable(filterRules);
    };

})()