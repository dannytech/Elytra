export class Player {
    public Username: string;
    public UUID: string;

    constructor(username: string, uuid: string) {
        this.Username = username;
        this.UUID = uuid;
    }
}