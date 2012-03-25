// Let's test this function
function isEven(val) {
    return val % 2 === 0;
}

test('raises CTRL event', function() {

    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFired = false;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL"])
        })
        .subscribe(function(){
            methodFired = true;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})

    ok(methodFired);
})

test('raises "CTRL+DOWN ARROW event one time', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"])
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})

    ok(methodFiredCount === 1, "raised event " + methodFiredCount + " times");
})

test('raises "CTRL+DOWN ARROW event actively and passively', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"]) && shortcut.numberOfKeysDown(2);
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 41, target: {tagName: "window"}})
    RxCuts.ObservableKeyup.onNext({keyCode : 41, target: {tagName: "window"}})

    ok(methodFiredCount === 2, "raised event " + methodFiredCount + " times");
})

test('raises "CTRL+DOWN ARROW event actively only', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"])
                && shortcut.numberOfKeysDown(2)
                && shortcut.isActive();
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 41, target: {tagName: "window"}})
    RxCuts.ObservableKeyup.onNext({keyCode : 41, target: {tagName: "window"}})

    ok(methodFiredCount === 1, "raised event " + methodFiredCount + " times");
})

test('raises "CTRL+DOWN ARROW event actively with "inOrder" beeing used', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"],true)
                && shortcut.numberOfKeysDown(2)
                && shortcut.isActive();
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})

    ok(methodFiredCount === 1, "raised event " + methodFiredCount + " times");
})

test('raises "CTRL+DOWN ARROW event passively only', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"])
                && shortcut.numberOfKeysDown(2)
                && shortcut.isPassive();
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 41, target: {tagName: "window"}})
    RxCuts.ObservableKeyup.onNext({keyCode : 41, target: {tagName: "window"}})

    ok(methodFiredCount === 1, "raised event " + methodFiredCount + " times");
})

test('Does not raise "CTRL+DOWN ARROW event" if there is a key in between and "inOrder" flag is beeing used', function() {

    RxCuts.resetState();
    RxCuts.ObservableKeydown = new Rx.Subject();
    RxCuts.ObservableKeyup = new Rx.Subject();

    var methodFiredCount = 0;
    RxCuts.observeShortcuts()
        .where(function(shortcut){
            return shortcut.areKeysDown(["CTRL", "DOWN ARROW"], true)
                && shortcut.numberOfKeysDown(2);
        })
        .subscribe(function(){
            methodFiredCount++;
        });

    RxCuts.ObservableKeydown.onNext({keyCode : 17, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 41, target: {tagName: "window"}})
    RxCuts.ObservableKeyup.onNext({keyCode : 41, target: {tagName: "window"}})
    RxCuts.ObservableKeydown.onNext({keyCode : 40, target: {tagName: "window"}})

    ok(methodFiredCount === 0, "raised event " + methodFiredCount + " times");
})