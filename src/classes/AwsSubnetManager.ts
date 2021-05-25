import EC2Client from "aws-sdk/clients/ec2";
import { ISubnetManager } from "src/interfaces/ISubnetManager";
import { AwsVpcManager } from "./AwsVpcManager";

export class AwsSubnetManager implements ISubnetManager {
  private client: EC2Client;

  private awsVpcManager: AwsVpcManager;

  constructor(awsRegionEndpoint: string, awsVpcManager: AwsVpcManager) {
    this.client = new EC2Client({ region: awsRegionEndpoint });
    this.awsVpcManager = awsVpcManager;
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @param {string} vpcTagName e.g. VIR1NODE
   * @param {string} cidrBlock  e.g. 10.0.0.0/16
   * @return {*}  {Promise<void>}
   * @memberof AwsSubnetManager
   */
  async createSubnet(
    subnetTagName: string,
    vpcTagName: string,
    cidrBlock: string
  ): Promise<void> {
    if (await this.exists(subnetTagName)) {
      throw new SubnetNameAlreadyExistsError(subnetTagName);
    }

    const vpcId = await this.awsVpcManager.vpcId(vpcTagName);

    if (!vpcId) {
      throw new VpcDoesNotExistError(vpcTagName);
    }

    try {
      await this.client
        .createSubnet({
          VpcId: vpcId,
          CidrBlock: cidrBlock,
          TagSpecifications: [
            {
              ResourceType: "subnet",
              Tags: [{ Key: "Name", Value: subnetTagName }],
            },
          ],
        })
        .promise();
    } catch (e) {
      if (e.code === "InvalidSubnet.Range") {
        throw new CidrBlockImpossible(cidrBlock);
      }

      throw e;
    }
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {*}  {Promise<void>}
   * @memberof AwsSubnetManager
   */
  async deleteSubnet(subnetTagName: string): Promise<void> {
    const subnetId = await this.subnetId(subnetTagName);

    if (subnetId) {
      await this.client.deleteSubnet({ SubnetId: subnetId }).promise();
    }
  }

  /**
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {*}  {Promise<boolean>}
   * @memberof AwsSubnetManager
   */
  async exists(subnetTagName: string): Promise<boolean> {
    const vpcId = await this.subnetId(subnetTagName);

    return !!vpcId;
  }

  /**
   * Get a SubnetId by the subnetTagName
   *
   * @private
   * @param {string} subnetTagName e.g. VIR1NODE
   * @return {Promise<string | null>}
   * @memberof AwsVpcManager
   */
  private async subnetId(subnetTagName: string): Promise<string | null> {
    const { Subnets }: EC2Client.DescribeSubnetsResult = await this.client
      .describeSubnets({
        Filters: [
          {
            Name: "tag:Name",
            Values: [subnetTagName],
          },
        ],
      })
      .promise();

    if (!Subnets || !Subnets[0] || !Subnets[0].SubnetId) {
      return null;
    }

    return Subnets[0].SubnetId;
  }
}

export class SubnetNameAlreadyExistsError extends Error {
  constructor(subnetTagName: string) {
    super(`The subnet with the tagName: ${subnetTagName} already exists`);
  }
}

export class VpcDoesNotExistError extends Error {
  constructor(vpcTagName: string) {
    super(`The Vpc with the tagName: ${vpcTagName} does not exists`);
  }
}

export class CidrBlockImpossible extends Error {
  constructor(cidrBlock: string) {
    super(`The cidrBlock: ${cidrBlock} cannot be assigned to this subnet`);
  }
}
