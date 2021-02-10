const serviceUuid = 0xffe0 //"0000ffe0-0000-1000-8000-00805f9b34fb";
let myCharacteristic;
let myCharacteristic2;
let myValue = 0;
let myBLE;
let isConnected = false;
myBLE = new p5ble();

let isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

console.log(isTouchDevice)

// event listners
document.getElementById("move-speed").addEventListener("change", function(){
    let num = "V" + this.value.toString() + "\n";
    sendData(num);
    document.getElementById("info-move-speed").innerHTML = "MOVE SPEED: " + this.value.toString();
})

document.getElementById("turn-speed").addEventListener("change", function(){
    let num = "T" + this.value.toString() + "\n";
    sendData(num);
    document.getElementById("info-turn-speed").innerHTML = "MOVE SPEED: " + this.value.toString();
})

if (isTouchDevice)
{
    document.getElementById("UP").addEventListener("touchstart", function(){sendData("W\n");})
    document.getElementById("UP").addEventListener("touchend", function(){sendData("P\n");})

    document.getElementById("LEFT").addEventListener("touchstart", function(){sendData("A\n");})
    document.getElementById("LEFT").addEventListener("touchend", function(){sendData("P\n");})

    document.getElementById("DOWN").addEventListener("touchstart", function(){sendData("S\n");})
    document.getElementById("DOWN").addEventListener("touchend", function(){sendData("P\n");})

    document.getElementById("RIGHT").addEventListener("touchstart", function(){sendData("D\n");})
    document.getElementById("RIGHT").addEventListener("touchend", function(){sendData("P\n");})

    document.getElementById("connect").addEventListener("click", function(){connectToBle();})

    document.getElementById("MANUAL").addEventListener("touchstart", function(){sendData("M\n");})

    document.getElementById("FOLLOWER").addEventListener("touchstart", function(){sendData("L\n");})

    document.getElementById("AVOIDANCE").addEventListener("touchstart", function(){sendData("O\n");})

    document.getElementById("disconnect").addEventListener("touchstart", function(){
        sendData("P\n");
        setTimeout(function(){myBLE.disconnect();}, 1000);
    })
}
else
{
    document.getElementById("UP").addEventListener("mousedown", function(){sendData("W\n");})
    document.getElementById("UP").addEventListener("mouseup", function(){sendData("P\n");})

    document.getElementById("LEFT").addEventListener("mousedown", function(){sendData("A\n");})
    document.getElementById("LEFT").addEventListener("mouseup", function(){sendData("P\n");})

    document.getElementById("DOWN").addEventListener("mousedown", function(){sendData("S\n");})
    document.getElementById("DOWN").addEventListener("mouseup", function(){sendData("P\n");})

    document.getElementById("RIGHT").addEventListener("mousedown", function(){sendData("D\n");})
    document.getElementById("RIGHT").addEventListener("mouseup", function(){sendData("P\n");})

    document.getElementById("connect").addEventListener("mousedown", function(){connectToBle();})

    document.getElementById("MANUAL").addEventListener("mousedown", function(){sendData("M\n");})

    document.getElementById("FOLLOWER").addEventListener("mousedown", function(){sendData("L\n");})

    document.getElementById("AVOIDANCE").addEventListener("mousedown", function(){sendData("O\n");})

    document.getElementById("disconnect").addEventListener("mousedown", function(){
        sendData("P\n");
        setTimeout(function(){myBLE.disconnect();}, 1000);
        
    })
}




function connectToBle() {
    // Connect to a device by passing the service UUID
    myBLE.connect(serviceUuid, gotCharacteristics);
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
    if (error) console.log('error: ', error);
    console.log('characteristics: ', characteristics);
    myCharacteristic = characteristics[0];
    myCharacteristic2 = characteristics[1];


    myBLE.startNotifications(myCharacteristic, gotValue, 'string');
    isConnected = true
    document.getElementById("connection-status").innerHTML = "CONNECTED";
    document.getElementById("connection-status").style.color = "#FFFFFF";
    myBLE.onDisconnected(onDisconnected)
}

// A function that will be called once got values
function gotValue(value) {
    console.log('value: ', value);
}

function onDisconnected() {
    console.log("disconncted");
    isConnected = false;
    document.getElementById("connection-status").innerHTML = "DISCONNECTED";
    document.getElementById("connection-status").style.color = "#B6B6B6";
}

function sendData(command) {
    console.log(command)
    const inputValue = command;
    if (!("TextEncoder" in window)) {
        console.log("browser does not support text encoder try chrome")
    }
    
    var enc = new TextEncoder();
    console.log(str2ab(inputValue));
    myCharacteristic2.writeValue(enc.encode(inputValue));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}