export interface IInternetGateway {
    createInternetGateway(igwTagName: string): Promise<void>;

    deleteInternetGateway(igwTagName: string): Promise<void>;

    existInternetGateway(igwTagName: string): Promise<boolean>;
}