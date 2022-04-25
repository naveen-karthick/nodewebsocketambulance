import "reflect-metadata";
import { useExpressServer } from 'routing-controllers';
import * as cors from 'cors';
import * as express from 'express';
import * as bodyParser from 'body-parser';
var WebSocketServer = require('websocket').server;
import * as http from 'http';
import { AuthenticationController } from "./Controller/AuthenticationController";
import { UIResponse } from "./Models/response";
import { useContainer } from "class-validator";
let ambulances = [];
let trafficSystems = [];
const app = express();
app.use(bodyParser.json());
// let whitelist = [/\.spr\.bz$/, /\.nvenergy\.com$/, /localhost:8081$/, /localhost:8080$/, /localhost:8100$/,
//     /csr-dev.nvenergy.com:8100$/, /cdx-dev.nvenergy.com:8100$/, /192.168.1.32:8100$/, /192.168.1.191:8100$/, /se344rdv.spr.bz:30200$/];
// let corsOptions = {
//     origin: function (origin: string, callback: (err: Error, allow: boolean) => void): any {
//         let originIsWhitelisted: boolean = true;
//         if (origin) {
//             whitelist.some((element, index, array) => {
//                 if (element.test(origin)) {
//                     originIsWhitelisted = true;
//                     return true;
//                 } else {
//                     originIsWhitelisted = true;
//                 }
//             });
//         }
//         callback(null, originIsWhitelisted);
//     },
//     exposedHeaders: ['authorization']
// };


// app.use(cors(corsOptions));
useExpressServer(app, {
    controllers: [AuthenticationController],
});
const server = http.createServer(app);


var wsServer = new WebSocketServer({
    httpServer: server
});
wsServer.on('request', function (request) {
    handleRequest(request);
});

server.listen(3080, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});

console.log('Hey this is naveen');

function handleRequest(request: any) {
    let user: any = {};
    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection from origin '
        + request.origin + '.');

    connection.on('message', function (message) {


        handleMessage(connection, message, user);


    });
    connection.on('close', function (connection) {
        // close user connection
        if(user.type==='traffic') {
        let index = trafficSystems.findIndex(trafficSystem => {
            return trafficSystem.id == user.id;
        });
        if (index >= 0) {
            console.log('removing traffic system whose id was' + user.id);
            trafficSystems.splice(index);
        }
    } else if(user.type === 'Ambulance') {
        let index = ambulances.findIndex(ambulance => {
            return ambulance.id == user.id;
        });
        if (index >= 0) {
            console.log('removing Ambulance system whose id was' + user.id);
            ambulances.splice(index);
        }
    }
    });
}
function handleMessage(_connection: any, message: any, user: any) {
    let data: any = {};
    console.log(message.utf8Data);
    if (message.type === 'utf8') {
        try {
            data = JSON.parse(message.utf8Data);
            console.log('Successfully Parsed the data');
        } catch (err) {
            console.log(err);
            console.log('Error parsing data');
        }
        if (data.type === 'Ambulance' && !user.valid) {
            // Perform Authentication
            let index = ambulances.findIndex((ambulance) => {
                return ambulance.id === data.id;
            })
            if (index !== -1) {
                console.log('receiving request from a ambulances system with duplicate id');
                _connection.close();
                return;
            }
            console.log('Connected to a ambulance system');

            user.type = 'Ambulance';
            user.valid = true;
            user.id = data.id;
            let ambulance: any = {};
            ambulance.id = data.id;
            ambulance.connection = _connection;
            ambulances.push(ambulance);
        } else if (data.type === 'traffic' && !user.valid) {
            // Perform Authentication
            let index = trafficSystems.findIndex((trafficSystem) => {
                return trafficSystem.id == data.id;
            })
            if (index !== -1) {
                console.log('receiving request from a traffic system with duplicate id');
                _connection.close();
                return;
            }
            console.log('Connected to a traffic system');

            user.type = 'traffic';
            user.valid = true;
            user.id = data.id;
            let traffic: any = {};
            traffic.id = data.id;
            traffic.connection = _connection;
            trafficSystems.push(traffic);
            _connection.sendUTF('You can now receive an alert whenever there is an  ambulance emergency');
        }
        console.log(user);
        if (user.valid && user.type === 'Ambulance') {
            let response = new UIResponse(true, {
                'authenticated': true,
                'message': 'We will forward your request to the traffic system.'
            });

            _connection.sendUTF(JSON.stringify(response));
            console.log(trafficSystems[0].id);
            console.log(data.trafficId);
            let index = trafficSystems.findIndex((trafficSystem) => {
                return trafficSystem.id == data.trafficId;
            });

            if (index >= 0) {
                trafficSystems[index].connection.sendUTF(JSON.stringify({
                    'type': 'Ambulance_alert',
                    'state': data.state,
                    'lane': data.lane,
                    'ambulance_id': data.id
                }));
            } else {
                console.log('traffic system is not connectd to web socket');
            }
            // if (data.gps) {
            //     let trafficResponse: any = {};
            //     trafficResponse.id = data.id;
            //     trafficResponse.gps = data.gps
            //     if (trafficSystems.length > 0) {
            //         trafficSystems.forEach(traffic => {
            //             traffic.connection.sendUTF(JSON.stringify(trafficResponse));
            //         });
            //     }
            // }
        } else if (user.valid && data.type === 'traffic_alert') {
            let index = trafficSystems.findIndex((traffic) => {
                return traffic.id === data.nearbyTrafficId;
            });
            console.log('i am gonna send a traffic alert');
            console.log(index);
            if (index >= 0) {
                trafficSystems[index].connection.sendUTF(JSON.stringify({
                    'type': 'traffic_alert',
                    'trafficDensity': data.weight,
                    'lane': data.lane
                }));
            }
        }

    } else {
        _connection.sendUTF('You are a Invalid user');
    }
}
