import { AWSError } from "aws-sdk";
import EC2Client from "aws-sdk/clients/ec2";
import { IVpcManager } from "src/interfaces/IVpcManager";

export class AwsVpcManager implements IVpcManager {
  private client: EC2Client;

  private vpcs: EC2Client.Vpc[] = [];

  constructor(awsProfileName: string, awsRegionEndpoint: string) {
    this.client = new EC2Client({region: awsRegionEndpoint})
   }

  public async createVpc(vpcTagName: string, cidrBlock: string): Promise<void> {
    this.client.createVpc(
      { 
        CidrBlock: cidrBlock,
        TagSpecifications: [
          { 
            ResourceType: "vpc", 
            Tags: [{Key: "Name", Value: vpcTagName}] 
          }
        ]
      }, 
      (err: AWSError, data: EC2Client.CreateVpcResult) => {
        if(err) {
          throw new Error("Error during Vpc creation: \n" + err);
        }
        else if(data.Vpc) {
          this.vpcs.push(data.Vpc);
        }
        else {
          throw new Error("Vpc is undefined");
        }
      }
    );
  }

  public async deleteVpc(vpcTagName: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async exists(vpcTagName: string): Promise<boolean> {
    const vpc: string = await this.vpcId(vpcTagName);

    return !!vpc;
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
