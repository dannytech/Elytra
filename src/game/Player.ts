export class Player {
    public Username: string;
    public UUID: string;

    constructor(username: string, uuid?: string) {
        this.Username = username;
        if (uuid) this.UUID = uuid;
    }
}