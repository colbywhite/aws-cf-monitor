import TransportStream from 'winston-transport';

export class SpyTransport extends TransportStream {
    public constructor(opts: TransportStream.TransportStreamOptions, public spy: jasmine.Spy) {
        super(opts);
    }

    public log(info: any, next: () => void): any {
        this.spy(info);
        next();
    }
}

