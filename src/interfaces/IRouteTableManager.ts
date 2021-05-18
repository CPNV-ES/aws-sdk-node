export interface IRouteTableManager {
    createRouteTable(routeTableTagName: string, vpcTagName: string): Promise<string>;

    deleteRouteTable(routeTableTagName: string): Promise<void>;

    exists(routeTableTagName: string): Promise<boolean>;
    
    associateWithSubnet(routeTableTagName: string, subnetTagName: string): Promise<string>;

    dissociateFromSubnet(routeTableTagName: string, subnetTagName: string): Promise<void>;
}