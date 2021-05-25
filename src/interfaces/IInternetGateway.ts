export interface IInternetGateway {
    createInternetGateway(igwTagName: string): Promise<void>;

    deleteInternetGateway(igwTagName: string): Promise<void>;

    existInternetGateway(igwTagName: string): Promise<boolean>;

    attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void>

    detachInternetGateway(igwTagName: string, vpcTagName: string): Promise<void>
}