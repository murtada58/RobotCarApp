const refreshRate = 100;
let lastSentCommand = "P";
let lastSentAnalog = 0;
setInterval(getGamepadState, refreshRate);
function getGamepadState() {

    // Returns up to 4 gamepads.
    const gamepads = navigator.getGamepads();

    // We take the first one, for simplicity
    const gamepad = gamepads[0];

    // Escape if no gamepad was found
    if (!gamepad)
    {
        console.log('No gamepad found.');
        document.getElementById("controller-connection-status").innerHTML = "DISCONNECTED";
        document.getElementById("controller-connection-status").style.color = "#B6B6B6";
        return;
    }
    else
    {
        document.getElementById("controller-connection-status").innerHTML = "CONNECTED";
        document.getElementById("controller-connection-status").style.color = "#FFFFFF";
        // Filter out only the buttons which are pressed
        const pressedButtons = gamepad.buttons
        .map((button, id) => ({id, button}))
        .filter(isPressed);
        let currentMoveButton = "P"
        // Print the pressed buttons to our HTML
        for (const button of pressedButtons) {
            //console.log(button);
            //console.log(`Button ${button.id} was pressed.`)
            if (button.id === 12 || button.id === 13 || button.id === 14 || button.id === 15)
            {
                currentMoveButton = button.id.toString();
                //console.log(button.id)
            }
            
        }

        if (lastSentCommand !== currentMoveButton)
        {
            lastSentCommand = currentMoveButton;
            if (lastSentCommand === "12"){sendData("W\n");}
            else if (lastSentCommand === "13"){sendData("S\n")}
            else if (lastSentCommand === "14"){sendData("A\n")}
            else if (lastSentCommand === "15"){sendData("D\n")}
            else {sendData("P\n")}
        }

        let leftAnalogHorizontal = gamepad.axes[0].toFixed(1) * 10;
        let leftAnalogVertical = gamepad.axes[1].toFixed(1) * 10;
        let rightAnalogHorizontal = gamepad.axes[2].toFixed(1);
        let rightAnalogVertical = gamepad.axes[3].toFixed(1);

        document.getElementById("0").innerHTML = leftAnalogHorizontal;
        document.getElementById("1").innerHTML = leftAnalogVertical;

        if (Math.abs(leftAnalogHorizontal) > 1 && Math.abs(leftAnalogHorizontal) > Math.abs(leftAnalogVertical))
        {
            lastSentAnalog = Math.abs(leftAnalogHorizontal);
            sendData("Z" + leftAnalogHorizontal + "\n");
        }
        else if (Math.abs(leftAnalogVertical) > 1)
        {
            lastSentAnalog = Math.abs(leftAnalogVertical);
            sendData("X" + leftAnalogVertical + "\n");
        }
        else if (lastSentAnalog != 0)
        {
            lastSentAnalog = 0;
            sendData("C\n");
            document.getElementById("info-move-speed").innerHTML = "MOVE SPEED: 255";
            document.getElementById("info-turn-speed").innerHTML = "TURN SPEED: 255";
            analogStopV = true;
            analogStopH = true;
            document.getElementById("move-speed").value = 255;
            document.getElementById("turn-speed").value = 255;
        }
    }
}

function isPressed({button: {pressed}}) {
    return !!pressed;
}

function log(message) {
    const date = new Date().toISOString();
    output.innerHTML += `${date}: ${message}\n`;
}

/*
    BUTTON ids

    up: 12
    left: 14
    down: 13
    right: 15

    triangle: 3
    square: 2
    cross: 0
    circle: 1

    l1: 4
    l2: 6
    l3: 10
    r1: 5
    r2: 7
    r3: 11

    share: 8
    options: 9
    pslogo: 16
    touchpadpress: 17
*/