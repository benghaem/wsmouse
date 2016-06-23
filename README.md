## WS Mouse
----

Control your mouse using your phone's accelerometers and web browser.

## Building

Run make from the root directory:
`make`

## Running

First change the LOCAL_IP variable in the javascript file located at:
`src/assets/script.js` to the ip of your computer on the network

Next host the source files:
(Python works well here in a pinch)

`
cd src/assets/
python -m http.server 8080
`

Then run the wsmouse executable that you built in bin
`./bin/wsmouse`

