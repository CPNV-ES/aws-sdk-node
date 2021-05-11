export interface ISubnetManager {

    createSubnet(subnetTagName: string, vpcId: string, cidrBlock: string): Promise<void>;

    deleteSubnet(subnetTagName: string): Promise<void>;

    exists(subnetTagName: string): Promise<boolean>;
}