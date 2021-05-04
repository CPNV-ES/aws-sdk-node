import EC2Client from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client: EC2Client;

  private vpcs: EC2Client.Vpc[] = [];

  constructor(awsProfileName: string, awsRegionEndpoint: string) {
    this.client = new EC2Client({ region: awsRegionEndpoint });
  }

  
  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    if(this.exists(vpcTagName)) {
      throw new Error(`There is already a Vpc with the tag Name ${vpcTagName}`);
    }

    await this.client.createVpc({ 
      CidrBlock: cidrBlock,
      TagSpecifications: [
        { 
          ResourceType: "vpc", 
          Tags: [{Key: "Name", Value: vpcTagName}] 
        }
      ]
    }).promise();
  }

  public async deleteVpc(vpcTagName: string): Promise<void> {
    const vpcId: string = await this.vpcId(vpcTagName);

    await this.client.deleteVpc({ VpcId: vpcId }).promise();
  }

  public async exists(vpcTagName: string): Promise<boolean> {
    const vpcId: string = await this.vpcId(vpcTagName);

    return !!vpcId;
  }

  /**
   * TODO(alexandre): Handle describeVpcs pagination
   *
   * @private
   * @return {*}  {Promise<void>}
   * @memberof AwsVpcManager
   */
  private async describeVpcs(): Promise<void> {
    const describeVpcs: EC2Client.DescribeVpcsResult = await this.client.describeVpcs().promise();
    this.vpcs = describeVpcs.Vpcs ?? [];
  }

  private async vpcId(vpcTagName: string): Promise<string> {
    const { Vpcs }: EC2Client.DescribeVpcsResult = await this.client.describeVpcs({
      Filters: [
        {

          Name: "tag:Name",
          Values: [vpcTagName],
        }
      ]
    }).promise();

    if (!Vpcs) {
      throw new Error(`The Vpc with the tagName: ${vpcTagName} does not exist`);
    }

    if (!Vpcs[0].VpcId) {
      throw new Error(`The Vpc with the tagName: ${vpcTagName} does not have a VpcId`);
    }

    return Vpcs[0].VpcId;
  }
}
