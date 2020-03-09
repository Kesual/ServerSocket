import express from "express";
import * as http from "http";
import io from "socket.io";
import {User} from "./Classes/user";
import {Message} from "./Classes/Message";
import {MessageEnum} from "./Enums/MessageEnum";
import {SocketCommandEnum} from "./Enums/SocketCommandEnum";

export class Server {

    Logindata = {
      username: 'kesc9405',
      password: 'test123',
    };

    public socket: io.Server;
    private port = process.env.PORT || 3000;
    private clients: User[] = [];

    constructor() {
        const app = express();
        const server = new http.Server(app);
        this.socket = io(server, {
            pingInterval: 10000,
            pingTimeout: 5000
        });

        server.listen(this.port, () => {
            console.log(`started on port: ${this.port}`);
        });
    }

    connect() {
        this.socket.on('connection', (socket => {
            console.log('user connected');

            this.receive(socket);

            socket.on('name', (name) => {
                const nUser = new User(socket.id, name);
                this.clients.push(nUser);
                this.send(socket.id, SocketCommandEnum.NEW_USER, nUser);
                this.sendAll(SocketCommandEnum.USER_LIST, this.clients);
                this.showAll();
            });

            socket.on('disconnect', () => {
                const index = this.clients.map(e => {
                    return e.id;
                }).indexOf(socket.id);

                console.log(this.clients[index].name + ' is disconnected now.');

                this.clients.splice(index, 1);
                this.sendAll(SocketCommandEnum.USER_LIST, this.clients);
            })
        }));
    }

    showAll() {
        this.clients.forEach((c: User) => {
            console.log(c.name, c.id);
        })
    }

    send(id: string, cmd: SocketCommandEnum, load: any) {
        console.log('OUT -->', cmd);
        this.socket.to(id).emit('socketinfo', {
            command: cmd,
            data: load
        });
    }

    sendAll(cmd: SocketCommandEnum, load: any = null) {
        this.socket.emit('socketinfo', {
            command: cmd,
            data: load
        })
    }

    receive(socket: any) {
        socket.on('message', (message: Message) => {
            console.log('IN -->', message.command);
            switch (message.command) {
                case MessageEnum.LOGIN:
                    if (
                        message.data.username === this.Logindata.username
                        &&
                        message.data.password === this.Logindata.password
                    ) {
                        this.send(socket.id, SocketCommandEnum.LOGIN_SUCCESS, null)
                    } else {
                        this.send(socket.id, SocketCommandEnum.LOGIN_FALSE, {info: 'Falsche Anmeldedaten!'})
                    }
                    break;
                case MessageEnum.MESSAGE:
                    this.send(message.receiver, SocketCommandEnum.NEW_MESSAGE, message.data);
                    break;
            }
        })
    }
}

new Server().connect();
