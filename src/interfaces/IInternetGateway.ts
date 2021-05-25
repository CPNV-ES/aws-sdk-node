export interface IInternetGateway {
    createInternetGateway(igwTagName: string): Promise<void>;

    deleteInternetGateway(igwTagName: string): Promise<void>;

    existInternetGateway(igwTagName: string): Promise<boolean>;

    attachInternetGateway(igwTagName: string, vpcTagName: string): Promise<boolean>

    detachInternetGateway(igwTagName: string, vpcTagName: string): Promise<boolean>
}