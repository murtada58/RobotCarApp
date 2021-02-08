const serviceUuid = "0000ffe0-0000-1000-8000-00805f9b34fb";
let myCharacteristic;
let myCharacteristic2;
let myValue = 0;
let myBLE;
let isConnected = false;
myBLE = new p5ble();

function connectToBle() {
    // Connect to a device by passing the service UUID
    myBLE.connect(serviceUuid/*0xFFE0*/, gotCharacteristics);
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
    if (error) console.log('error: ', error);
    console.log('characteristics: ', characteristics);
    myCharacteristic = characteristics[0];
    myCharacteristic2 = characteristics[1];


    myBLE.startNotifications(myCharacteristic, gotValue, 'string');
    isConnected = true
    myBLE.onDisconnected(onDisconnected)
}

// A function that will be called once got values
function gotValue(value) {
    console.log('value: ', value);
}

function onDisconnected() {
    console.log("disconncted");
    isConnected = false;
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