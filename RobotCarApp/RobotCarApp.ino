#include <SoftwareSerial.h>
#include <Servo.h> // include the servo libary this gives us access to functions and classes from the library

// TX and RX pin numbers
const uint8_t BLU_RX_ARD_TX = 1;
const uint8_t BLU_TX_ARD_RX = 0;

SoftwareSerial bluetooth(BLU_TX_ARD_RX, BLU_RX_ARD_TX);

Servo servosweep; // create a Servo class object with the name servosweep

const int SERVO_PIN = 3; // Servo motor control pin

// motor control pins
const int ENL =  5; // Enable left
const int ENR = 6; // Enable right
const int WLF = 7; // wheel left front (when high and back low causes wheels to spin forward)
const int WLB = 8; // wheel left back
const int WRF = 11; // wheel right front (when high and back low causes wheels to spin forward)
const int WRB = 9; // wheel right back

// line tracking IR sensor pins
const int LTL = 2; // line tracking left
const int LTM = 4; // line tracking middle
const int LTR = 10; // line tracking right

// intialising move speed and turn speed for line following mode
const int DEFAULT_SPEED = 150;
const int DEFAULT_TURN_SPEED = 130;

// Echo and Trig pins of ultrasonic sensor
const int ECHO = A4;
const int TRIG = A5;

const int DECISION_DISTANCE_CM = 30; // the distance at which to consider another direction to avoid collision

const unsigned long TIME_FOR_90_TURN = 600; // the time that it takes for a 90 degree turn at 130 turn speed (this value might be different depending on the surface and operating conditions)


// intalising the car move speed and car turn speed
int carSpeed = 255;
int carTurnSpeed = 255;

bool lost = false; // This variable keeps track of if we have lost the track or not it is used to determine when the car should stop moving
bool lastDirectionRight = true; // keeps track of the last direction turned in right is true and left is false

String currentState = "manual";

String recieved = ""; // the last recieved message

const int messageIntervalTime = 100; // the time between messages used to ensure that messages have enough time to send
unsigned long messageTimer = 0; // keeps track of the time since the last message was sent same data type as returned variable from the millis function

void setup()
{
    bluetooth.begin(9600);
    Serial.begin(9600);
    // setting all the pinmodes for the motor pins and the IR pins 
    pinMode(WLF, OUTPUT);
    pinMode(WLB, OUTPUT);
    pinMode(WRB, OUTPUT);
    pinMode(WRF, OUTPUT);
    pinMode(ENL, OUTPUT);
    pinMode(ENR, OUTPUT);
    pinMode(LTL, INPUT);
    pinMode(LTM, INPUT);
    pinMode(LTR, INPUT);
    pinMode(TRIG, OUTPUT);
    pinMode(ECHO,INPUT);

    servosweep.attach(SERVO_PIN); // set the pin SERVO_PIN as the pin we use to communicate with the servo motor, when we use the servosweep object functions they will act on this pin
    
    // setting trig to low intially as we need it to start low when communicating with the ultrasonic sensor
    digitalWrite(TRIG, LOW);

    // setting the starting angle for the servo at 90 degrees so that it faces forward
    servosweep.write(90);
    delay(500);
}

void loop()
{
    newBluetoothMessage();

    if (currentState == "manual")
    {
        manualControl(recieved);
    }
    else if (currentState == "lineFollower")
    {
        lineFollower();
    }
    else if (currentState == "obstacleAvoidance")
    {
        obstacleAvoidance();
    }
}

bool newBluetoothMessage()
{
    char charBuffer[20];//most we would ever see
    if (bluetooth.available() > 0)
    {
        int numberOfBytesReceived = bluetooth.readBytesUntil('\n', charBuffer, 19);
        charBuffer[numberOfBytesReceived] = NULL;
        recieved = charBuffer;
        if (recieved[0] == 'M')
        {
            servosweep.write(90);
            currentState = "manual";
            stop();
        }
        else if (recieved[0] == 'L')
        {
            lost = false;
            servosweep.write(90);
            currentState = "lineFollower";
            stop();
        }
        else if (recieved[0] == 'O')
        {
            // setting the starting angle for the servo at 90 degrees so that it faces forward
            servosweep.write(90);
            delay(500);
            currentState = "obstacleAvoidance";
            stop();
        }
        return true;
    }
    else
    {
        return false;
    }
}

void manualControl(String code)
{
    if (code[0] == 'W')
    {
      forwards(carSpeed);
    }
    else if (code[0] == 'A')
    {
      antiClockwise(carTurnSpeed);
    }
    else if (code[0] == 'S')
    {
      backwards(carSpeed);
    }
    else if (code[0] == 'D')
    {
      clockwise(carTurnSpeed);
    }
    else if (code[0] == 'P')
    {
      stop();
    }
    else if (code[0] == 'C')
    {
        stop();
        carSpeed = 255;
        carTurnSpeed = 255;
    }
    else if (code[0] == 'V')
    {
        code.remove(0, 1);
        carSpeed = code.toInt();
    }
    else if (code[0] == 'T')
    {
        code.remove(0, 1);
        carTurnSpeed = code.toInt();
    }
    else if (code[0] == 'Z')
    {
        code.remove(0, 1);
        if (code[0] == '-')
        {
            code.remove(0, 1);
            carTurnSpeed = (255 * code.toInt()) / 10;
            antiClockwise(carTurnSpeed);
        }
        else
        {
            carTurnSpeed = (255 * code.toInt()) / 10;
            clockwise(carTurnSpeed);
        }
    }
    else if (code[0] == 'X')
    {
        code.remove(0, 1);
        if (code[0] == '-')
        {
            code.remove(0, 1);
            carSpeed = (255 * code.toInt()) / 10;
            forwards(carSpeed);
        }
        else
        {
            carSpeed = (255 * code.toInt()) / 10;
            backwards(carSpeed);
        }
    }
}

void lineFollower()
{
    // storing the sensor readings for this loop for use in the checks below (constant because they shouldn't change during the loop iteration they are read in)
    const bool VLTL = digitalRead(LTL);
    const bool VLTM = digitalRead(LTM);
    const bool VLTR = digitalRead(LTR);
    
    // check if car not lost (still following a line) and all IR sensors return 1 (not on black line)  
    if (!lost && VLTL && VLTM && VLTR)
    {
        stop(); // stop the car
        while (messageTimer + messageIntervalTime > millis()){} // wait until there is enough time between messages
        Serial.println("111"); // send the meesage 111 corresponding to the sensor value readings wish means searching for track
        messageTimer = millis(); // reset the message timer for the next message
        
        // if the code gets here it means that the car has gone of the track
        // so we will search for the track using the function below
        searchForTrack();
    }
    else if (!VLTL) // check if the left IR sensor detected a blackline
    {
        lost = false; // set lost to false since if the left IR sensor detect we are back on track so we should search again when we lose it
        lastDirectionRight = false; // set the last rotation direction to left (the vairable is a bool false for left true for right)
        antiClockwise(DEFAULT_SPEED); // rotate anticlockwise at DEFAULT_SPEED (set above)
        
        if (messageTimer + messageIntervalTime <= millis())
        {
            String sensorValues = "";
            if (VLTL) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTM) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTR) { sensorValues += "1";} else {sensorValues += "0";}
            Serial.println(sensorValues); // send sensor values if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        } 
    }
    else if (!VLTR) // check if the right IR sensor detected a blackline
    {
        lost = false; // set lost to false since if the right IR sensor detect we are back on track so we should search again when we lose it
        lastDirectionRight = true; // set the last rotation direction to right (the vairable is a bool false for left true for right)
        clockwise(DEFAULT_SPEED); // rotate clockwise at DEFAULT_SPEED (set above)

        if (messageTimer + messageIntervalTime <= millis())
        {
            String sensorValues = "";
            if (VLTL) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTM) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTR) { sensorValues += "1";} else {sensorValues += "0";}
            Serial.println(sensorValues); // send sensor values if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        } 
    }
    else if (!VLTM) // check if the middle IR sensor detected a blackline
    {
        lost = false; // set lost to false since if the middle IR sensor detect we are back on track so we should search again when we lose it
        forwards(DEFAULT_SPEED); // move forwards at DEFAULT_SPEED (set above)

        if (messageTimer + messageIntervalTime <= millis())
        {
            String sensorValues = "";
            if (VLTL) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTM) { sensorValues += "1";} else {sensorValues += "0";}
            if (VLTR) { sensorValues += "1";} else {sensorValues += "0";}
            Serial.println(sensorValues); // send sensor values if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        } 
    }
    else // if no other check is true just stop this should only happen if we have lost the track (the end condidtion in this case)
    {
        stop();

        if (messageTimer + messageIntervalTime <= millis())
        {
            Serial.println("s"); // send s to show that the track is either done or lost and car is stopped if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        }
    }
}

void obstacleAvoidance()
{
    // store the distance in cm in for later checks
    int distanceCM = getDistanceCM();

    // if the distance is greater than the decision distance keep moving forward otherwise check left and right direction and move in the direction with most space
    if (distanceCM > DECISION_DISTANCE_CM)
    {
        forwards(DEFAULT_SPEED);
        if (messageTimer + messageIntervalTime <= millis())
        {
            String message = "f" + String(distanceCM);
            Serial.println(message); // send current distance if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        } 
    }
    else
    {
        stop();
        while (messageTimer + messageIntervalTime > millis()){} // wait until there is enough time between messages
        if (messageTimer + messageIntervalTime <= millis())
        {
            String message = "r" + String(distanceCM);
            Serial.println(message); // send current distance if enough time since last message
            messageTimer = millis(); // reset the message timer for the next message
        }
        redirect(); // checks right and left to decide if it should rotate right or left or moveback a bit instead if both directions are blocked
    }
    
    delay(50); // small delay to force small movement before another decision is made smooths out movement a bit
}

// redirects the car to a different direction
void redirect()
{
    stop(); // stop the car while making decsisions to avoid crashing
    if (newBluetoothMessage() && (recieved[0] == 'L' || recieved[0] == 'M')){return;}
    servosweep.write(0); // turn the sensor right
    delay(500); // delay to give time for the servo to turn the sensor fully to the right
    int distanceRightCM = getDistanceCM(); // get the distance in the right direction

    if (newBluetoothMessage() && (recieved[0] == 'L' || recieved[0] == 'M')){return;}
    servosweep.write(180); // turn the sensor left now
    delay(500); // delay to give the servo time to fully rotate the sensor left
    int distanceLeftCM = getDistanceCM(); // get the distance in the left direction

    // if both distances are smaller than the decision distance move back for a bit and call the redirect function again to check left and right again now
    if (distanceLeftCM < DECISION_DISTANCE_CM && distanceRightCM < DECISION_DISTANCE_CM)
    {
        if (newBluetoothMessage() && (recieved[0] == 'L' || recieved[0] == 'M')){return;}
        backwards(DEFAULT_SPEED); // move the car backwards at the car speed
        delay(500); // delay to allow for this small backwards movement to happen
        redirect(); // call redirect again to check if the left and right direction are now clear
        return; // the last recursivley called redirect will handle setting the sensor back in the right place so exit the function here to avoid waiting an extra 500ms per recursive call
        // (this could add up to a lot depending on how deep in the recursion we are)
    }
    else if (distanceRightCM > distanceLeftCM) // if either left or right distances are larger than the decision distance check if right is bigger than left if so turn right
    {
        clockwise(DEFAULT_TURN_SPEED); // turn right
        delay(TIME_FOR_90_TURN); // delay to allow for 90 degree turn both the turnspeed and the time for the turn are predetermined but might be different depending on car battery level and enviornment
        stop(); // stop the car after the turn is done
    }
    else // if here than left distance is larger than the decision distance and the right distance so turn left
    {
        antiClockwise(DEFAULT_TURN_SPEED); // turn left
        delay(TIME_FOR_90_TURN); // delay to allow for 90 degree turn both the turnspeed and the time for the turn are predetermined but might be different depending on car battery level and enviornment
        stop(); // stop the car after the turn is done
    }
    
    if (newBluetoothMessage() && (recieved[0] == 'L' || recieved[0] == 'M')){return;}
    servosweep.write(90); // rotate the sensor back to the front
    delay(500); // delay to give time for the rotation to finsih before moving on
}

// returns the distance in cm determined using the ultrasonic sensor
int getDistanceCM()
{
  // sending a 10 microsecond long pulse to the ultrasonic sensor this causes the sensor to send out a sound wave and send back a pulse that we can use to determine the distance
    digitalWrite(TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG, LOW);

    // storing the duration that the returned pulse in echo is high for this is the time taken for the sound to travel from  the sensor and back after bouncing from an object in microseconds
    int duration = pulseIn(ECHO, HIGH);

    // return the distance in cm of the object that the sound bounced back from (all constants are precomupted for effiency leading to this formula assuming 20C and 50% humidity)
    return duration / 58;
}

// searches for the track by rotating the car 90 degrees clockwise and breaking out of the loop if it find the track again
// if not it rotates 180 degrees anticlockwise and breaking out of the loop if it find the track again the extra 90 degrees is to compensate for rotating 90 degreees clockwise before
// this function is quite usefull when 90 degree turns are encountered
void searchForTrack()
{
    // stop for a small amount of time to allow the car to come to halt before rotating
    stop();
    if (newBluetoothMessage() && (recieved[0] == 'O' || recieved[0] == 'M')){return;}
    delay(500);
    unsigned long currentTime = millis(); // store the current time (unsigned long to match the data type of millis() and avoid issues when the device has been on for too long)
    while (currentTime + TIME_FOR_90_TURN + 50 > millis()) // for the amount of time it takes for a 90 degree turn at 130 speed rotate clockwise and look for a blackline (adding 50 to compensate for the lower time at max speed)
    {   
        if (newBluetoothMessage() && (recieved[0] == 'O' || recieved[0] == 'M')){return;}
        if (lastDirectionRight) // this check is to determine which direction to rotate in first
        {
            clockwise(DEFAULT_TURN_SPEED);
            if (!digitalRead(LTR)) // check if a black line was found on the right IR sensor (this is the first sensor to find the line when turning clockwise)
            {
                return; // if black line was found exit the function and continue with the rest of the code
            }
        }
        else
        {
            antiClockwise(DEFAULT_TURN_SPEED);
            if (!digitalRead(LTL)) // check if a black line was found on the left IR sensor (this is the first sensor to find the line when turning anticlockwise)
            {
                return; // if black line was found exit the function and continue with the rest of the code
            }
        }
    }
    
    // stop for a small amount of time to allow the car to come to halt before rotating in the opposite direction
    stop();
    delay(250);
    lastDirectionRight = !lastDirectionRight;
    currentTime = millis(); // store the current time again
    while (currentTime + (TIME_FOR_90_TURN * 2) > millis()) // rotate anticlockwise for double the time it takes to make a 90 degree turn to make a 180 degree turn while searching
    {
        if (newBluetoothMessage() && (recieved[0] == 'O' || recieved[0] == 'M')){return;}
        if (lastDirectionRight) // this check is to determine which direction to rotate in first
        {
            clockwise(DEFAULT_TURN_SPEED);
            if (!digitalRead(LTR)) // check if a black line was found on the right IR sensor (this is the first sensor to find the line when turning clockwise)
            {
                return; // if black line was found exit the function and continue with the rest of the code
            }
        }
        else
        {
            antiClockwise(DEFAULT_TURN_SPEED);
            if (!digitalRead(LTL)) // check if a black line was found on the left IR sensor (this is the first sensor to find the line when turning anticlockwise)
            {
                return; // if black line was found exit the function and continue with the rest of the code
            }
        }
    }
    
    // if we get here it means we failed to find the blackline so set lost to true to stop the car from searching when the sensors don't detect anything and stop the car
    lost = true;
    stop(); 
}

// moves the car forwards at a given speed from 0 to 255
void forwards(int carSpeed)
{
    analogWrite(ENL, carSpeed);
    analogWrite(ENR, carSpeed);
    digitalWrite(WLF, HIGH);
    digitalWrite(WLB, LOW);
    digitalWrite(WRF, HIGH);
    digitalWrite(WRB, LOW);
}

// moves the car backwards at a given speed from 0 to 255
void backwards(int carSpeed)
{
    analogWrite(ENL, carSpeed);
    analogWrite(ENR, carSpeed);
    digitalWrite(WLF, LOW);
    digitalWrite(WLB, HIGH);
    digitalWrite(WRF, LOW);
    digitalWrite(WRB, HIGH);
    
}

// rotate the car anticlockwise
void antiClockwise(int carSpeed)
{
    analogWrite(ENL, carSpeed);
    analogWrite(ENR, carSpeed);
    digitalWrite(WLF, LOW);
    digitalWrite(WLB, HIGH);
    digitalWrite(WRF, HIGH);
    digitalWrite(WRB, LOW);
}

// rotate the car clockwise
void clockwise(int carSpeed)
{
    analogWrite(ENL, carSpeed);
    analogWrite(ENR, carSpeed);
    digitalWrite(WLF, HIGH);
    digitalWrite(WLB, LOW);
    digitalWrite(WRF, LOW);
    digitalWrite(WRB, HIGH);
}

// stop the car
void stop()
{
    digitalWrite(ENL, LOW);
    digitalWrite(ENR, LOW);
    // the values below don't matter since ENL and ENR are low however it makes sense for everything to be low if the car is not moving
    digitalWrite(WLF, LOW);
    digitalWrite(WLB, LOW);
    digitalWrite(WRF, LOW);
    digitalWrite(WRB, LOW);
}
