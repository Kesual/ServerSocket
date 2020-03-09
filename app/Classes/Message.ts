import {MessageEnum} from "../Enums/MessageEnum";

export interface Message {
    command: MessageEnum;
    data: any;
    receiver: string;
}
