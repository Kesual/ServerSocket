"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var http = __importStar(require("http"));
var socket_io_1 = __importDefault(require("socket.io"));
var user_1 = require("./Classes/user");
var MessageEnum_1 = require("./Enums/MessageEnum");
var SocketCommandEnum_1 = require("./Enums/SocketCommandEnum");
var Server = /** @class */ (function () {
    function Server() {
        var _this = this;
        this.Logindata = {
            username: 'kesc9405',
            password: 'test123',
        };
        this.port = process.env.PORT || 3000;
        this.clients = [];
        var app = express_1.default();
        var server = new http.Server(app);
        this.socket = socket_io_1.default(server, {
            pingInterval: 10000,
            pingTimeout: 5000
        });
        server.listen(this.port, function () {
            console.log("started on port: " + _this.port);
        });
    }
    Server.prototype.connect = function () {
        var _this = this;
        this.socket.on('connection', (function (socket) {
            console.log('user connected');
            _this.receive(socket);
            socket.on('name', function (name) {
                var nUser = new user_1.User(socket.id, name);
                _this.clients.push(nUser);
                _this.send(socket.id, SocketCommandEnum_1.SocketCommandEnum.NEW_USER, nUser);
                _this.sendAll(SocketCommandEnum_1.SocketCommandEnum.USER_LIST, _this.clients);
                _this.showAll();
            });
            socket.on('disconnect', function () {
                var index = _this.clients.map(function (e) {
                    return e.id;
                }).indexOf(socket.id);
                console.log(_this.clients[index].name + ' is disconnected now.');
                _this.clients.splice(index, 1);
                _this.sendAll(SocketCommandEnum_1.SocketCommandEnum.USER_LIST, _this.clients);
            });
        }));
    };
    Server.prototype.showAll = function () {
        this.clients.forEach(function (c) {
            console.log(c.name, c.id);
        });
    };
    Server.prototype.send = function (id, cmd, load) {
        console.log('OUT -->', cmd);
        this.socket.to(id).emit('socketinfo', {
            command: cmd,
            data: load
        });
    };
    Server.prototype.sendAll = function (cmd, load) {
        if (load === void 0) { load = null; }
        this.socket.emit('socketinfo', {
            command: cmd,
            data: load
        });
    };
    Server.prototype.receive = function (socket) {
        var _this = this;
        socket.on('message', function (message) {
            console.log('IN -->', message.command);
            switch (message.command) {
                case MessageEnum_1.MessageEnum.LOGIN:
                    if (message.data.username === _this.Logindata.username
                        &&
                            message.data.password === _this.Logindata.password) {
                        _this.send(socket.id, SocketCommandEnum_1.SocketCommandEnum.LOGIN_SUCCESS, null);
                    }
                    else {
                        _this.send(socket.id, SocketCommandEnum_1.SocketCommandEnum.LOGIN_FALSE, { info: 'Falsche Anmeldedaten!' });
                    }
                    break;
                case MessageEnum_1.MessageEnum.MESSAGE:
                    _this.send(message.receiver, SocketCommandEnum_1.SocketCommandEnum.NEW_MESSAGE, message.data);
                    break;
            }
        });
    };
    return Server;
}());
exports.Server = Server;
new Server().connect();
