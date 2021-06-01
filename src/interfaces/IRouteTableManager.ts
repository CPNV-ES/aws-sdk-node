export interface IRouteTableManager {
    createRouteTable(routeTableTagName: string, vpcTagName: string): Promise<void>;

    deleteRouteTable(routeTableTagName: string): Promise<void>;

    exists(routeTableTagName: string): Promise<boolean>;
    
    associateWithSubnet(routeTableTagName: string, subnetTagName: string): Promise<void>;

    dissociateFromSubnet(routeTableTagName: string, subnetTagName: string): Promise<void>;
}