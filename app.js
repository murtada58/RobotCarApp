const serviceUuid = 0xffe0 //"0000ffe0-0000-1000-8000-00805f9b34fb";
let myCharacteristic;
let myCharacteristic2;
let myValue = 0;
let myBLE;
let isConnected = false;
let runnning = false;
let currentLine = 0;
load();
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
    document.getElementById("info-turn-speed").innerHTML = "TURN SPEED: " + this.value.toString();
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

    document.getElementById("connect").addEventListener("click", function(){
        if (!isConnected){connectToBle();}
        else
        {
            sendData("P\n");
            setTimeout(function(){myBLE.disconnect();}, 100);
        }
    })

    document.getElementById("MANUAL").addEventListener("touchstart", function(){
        running = false;
        document.getElementById("MANUAL").style.color = "#FFFFFF";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
    
        document.getElementById("control").style.display = "grid";
        document.getElementById("custom-code").style.display = "none";
        sendData("M\n");
    })
    
    document.getElementById("FOLLOWER").addEventListener("touchstart", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#FFFFFF";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
        sendData("L\n");
    })
    
    document.getElementById("AVOIDANCE").addEventListener("touchstart", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#FFFFFF";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
        sendData("O\n");
    })
    
    document.getElementById("CUSTOM").addEventListener("touchstart", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#FFFFFF";
    
        document.getElementById("control").style.display = "none";
        document.getElementById("custom-code").style.display = "grid";
        sendData("M\n");
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

    document.getElementById("connect").addEventListener("click", function(){
        if (!isConnected){connectToBle();}
        else
        {
            sendData("P\n");
            setTimeout(function(){myBLE.disconnect();}, 100);
        }
    })

    document.getElementById("MANUAL").addEventListener("click", function(){
        running = false;
        document.getElementById("MANUAL").style.color = "#FFFFFF";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
    
        document.getElementById("control").style.display = "grid";
        document.getElementById("custom-code").style.display = "none";
        sendData("M\n");
    })
    
    document.getElementById("FOLLOWER").addEventListener("click", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#FFFFFF";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
        sendData("L\n");
    })
    
    document.getElementById("AVOIDANCE").addEventListener("click", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#FFFFFF";
        document.getElementById("CUSTOM").style.color = "#B6B6B6";
        sendData("O\n");
    })
    
    document.getElementById("CUSTOM").addEventListener("click", function(){
        document.getElementById("MANUAL").style.color = "#B6B6B6";
        document.getElementById("FOLLOWER").style.color = "#B6B6B6";
        document.getElementById("AVOIDANCE").style.color = "#B6B6B6";
        document.getElementById("CUSTOM").style.color = "#FFFFFF";
    
        document.getElementById("control").style.display = "none";
        document.getElementById("custom-code").style.display = "grid";
        sendData("M\n");
    })

}

function connectToBle() {
    // Connect to a device by passing the service UUID
    myBLE.connect(serviceUuid, gotCharacteristics);
    if (!navigator.bluetooth) {
        alert('Web Bluetooth API is not available in this browser try chrome instead')
    }
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
    document.getElementById("connect").innerHTML = "DISCONNECT"
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
    document.getElementById("connect").innerHTML = "CONNECT"
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

function generateBlock()
{
    let block = document.createElement("div");
    block.classList.add("block");
    let blockContent = "";
    blockContent += '<p class="command-label" > Command </p> ';
    blockContent += '<select name="command" class="commands">';
    blockContent += '<option value="W">Forwards</option>';
    blockContent += '<option value="S">Backwards</option>';
    blockContent += '<option value="D">Clockwise</option>';
    blockContent += '<option value="A">Anti Clockwise</option>';
    blockContent += '<option value="P">Stop</option>';
    blockContent += '</select>';
    blockContent += ' <p class="for" >For</p> ';
    blockContent += '<input type="number"  pattern="[0-9]{10}" step="1" min="50" value="100" class="time">';
    blockContent += ' <p class="units" >ms</p> '
    blockContent += '<button class="remove" onclick="remove(this)">X</button>';

    block.innerHTML = blockContent;
 
    document.getElementById("commands").appendChild(block);
}

function remove(element)
{
    element.parentElement.remove();
    let temp = document.getElementsByClassName("commands");
}


function save()
{
    let commandsArray = [];
    let temp = document.getElementsByClassName("commands");
    for (i = 0; i < temp.length; i++)
    {
        commandsArray.push(temp[i].value)
    }

    let timeArray = [];
    let temp1 = document.getElementsByClassName("time");
    for (i = 0; i < temp1.length; i++)
    {
        timeArray.push(temp1[i].value)
    }

    localStorage.setItem('commands', JSON.stringify(commandsArray));
    localStorage.setItem('time', JSON.stringify(timeArray));
    running = true;
    currentLine = 0;
    run();
}

function load()
{
    let commandsArray = JSON.parse(localStorage.getItem('commands'));
    let timeArray = JSON.parse(localStorage.getItem('time'));

    for (i = 0; i < commandsArray.length; i++)
    {
        generateBlock();
    }


    let temp = document.getElementsByClassName("commands");
    let temp1 = document.getElementsByClassName("time");
    for (i = 0; i < commandsArray.length; i++)
    {
        temp[i].value = commandsArray[i];
        temp1[i].value = timeArray[i];
    }
}

function run()
{
    let commandsArray = [];
    let temp = document.getElementsByClassName("commands");
    for (i = 0; i < temp.length; i++)
    {
        commandsArray.push(temp[i].value)
    }

    let timeArray = [];
    let temp1 = document.getElementsByClassName("time");
    for (i = 0; i < temp1.length; i++)
    {
        timeArray.push(temp1[i].value)
    }

    if (running && currentLine < commandsArray.length)
    {
        currentLine++;
        sendData(commandsArray[currentLine-1] + "\n");
        setTimeout(run, timeArray[currentLine-1])
    }
    else
    {
        sendData("P\n")
        running = false;
    }
}