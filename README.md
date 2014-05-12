Example Telemetry Service
--------------------------------------------------

## Overview

Send messages from a sensor to a cloud service that then sends the
message to N clients. Messages are sent via UDP with a HMAC(MD5)
messages. In addition, the messages have a number counter to assist in
ordering them (and in the future to resend lost messages).

## Install

$ npm install

## Lint and Test

$ gulp

## Run
$ node src/server.js
$ node src/sensor.js
$ node src/client.js

## TODO

1. Add HTTPS endpoint to exchange keys for HMAC.
2. Add resend support using message number.

