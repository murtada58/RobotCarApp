# RobotCarApp

This is an application t.hat allows the elegoo robot car to be controlled through the browser using the web bluetooth API using both the GUI and a controller which uses the Gamepad API

The app should work on both pc and mobile; however, if you wish to use the app make sure that you are using either the chrome browser or the edge browser as other browsers do not have support for the bluetooth API yet.

To use the application first upload the arduino sketch in this repositry onto the robot car.

Once the script has been uploaded press the connect button on the top right of the applications page to connect with the bluetooth module on the car, check if the DISCONNECTED status on the left changes to CONNECTED to ensure that you have successfully paired with the car.

Once this is done the car can be controlled through the page by pressing the buttons. and different modes can be toggeled by pressing their respective buttons on the left.

To control the car using a PS4 or PS5 controller either connect the controller to your device through a cable or bluetooth, and it should show the controller status change to CONNECTED.

The car can be moved with the  controller with either the left analog stick or the dpad. the buttons on the right can also be used to change to the different available modes (The buttons mappings are different on the ps4 and ps5 controllers for switching modes).
