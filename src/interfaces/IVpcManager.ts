export interface IVpcManager {
  createVpc(vpcTagName: string, cidrBlock: string): Promise<void>;

  deleteVpc(vpcTagName: string): Promise<void>;

  exists(vpcTagName: string): Promise<boolean>;
}
