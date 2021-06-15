import { AwsVpcManager } from "../AwsVpcManager";
import { AwsInternetGateway } from "../AwsInternetGateway";
import { AwsRouteTableManager } from "../AwsRouteTableManager";
import { AwsSubnetManager } from "../AwsSubnetManager";
import EC2Client from "aws-sdk/clients/ec2";

const client = new EC2Client({ region: process.env.AWS_REGION });

const vpcManager = new AwsVpcManager(client);
const internetGatewayManager = new AwsInternetGateway(client);
const subnetManager = new AwsSubnetManager(client, vpcManager);
const routeTableManager = new AwsRouteTableManager(client, vpcManager, subnetManager, internetGatewayManager);

const vpcTagName = "integration-vpc";
const vpcCidrBlock = "10.0.0.0/16";
const privateSubnetTagName = "integration-private_subnet";
const privateSubnetCidrBlock = "10.0.1.0/24";
const publicSubnetTagName = "integration-public_subnet";
const publicSubnetCidrBlock = "10.0.0.0/24";
const internetGatewayTagName = "integration-internet_gateway";
const customRouteTableTagName = "integartion-custom_route_table";

const cleanup = async () => {
  // Dissociate custom route table from all subnets
  await routeTableManager.dissociateFromAllSubnets(customRouteTableTagName);
  // Delete custom route table
  await routeTableManager.deleteRouteTable(customRouteTableTagName);

  // Detach internet gateway from the VPC
  await internetGatewayManager.detachInternetGateway(
    internetGatewayTagName,
    vpcTagName
  );
  // Delete internet gateway
  await internetGatewayManager.deleteInternetGateway(internetGatewayTagName);

  // Delete private subnet
  await subnetManager.deleteSubnet(privateSubnetTagName);

  // Delete public subnet
  await subnetManager.deleteSubnet(publicSubnetTagName);

  // Delete VPC
  await vpcManager.deleteVpc(vpcTagName);
};

beforeAll(async () => {
    await cleanup();

    jest.setTimeout(5*60*1000);    // 5 minutes
})

afterAll(async () => {
    await cleanup();
});  

describe("Aws infrastructure integration test", () => {
    test("Create infrastructure integration test", async () => {
        // Create VPC 
        await vpcManager.createVpc(vpcTagName, vpcCidrBlock);
        expect(await vpcManager.exists(vpcTagName)).toBeTruthy();

        // Create public subnet
        await subnetManager.createSubnet(publicSubnetTagName, vpcTagName, publicSubnetCidrBlock);
        expect(await subnetManager.exists(publicSubnetTagName)).toBeTruthy();

        // Create private subnet
        await subnetManager.createSubnet(privateSubnetTagName, vpcTagName, privateSubnetCidrBlock);
        expect(await subnetManager.exists(privateSubnetTagName)).toBeTruthy();

        // Create internet gateway
        await internetGatewayManager.createInternetGateway(internetGatewayTagName);
        expect(await internetGatewayManager.existInternetGateway(internetGatewayTagName)).toBeTruthy();
        // Attach to internet gateway to the VPC
        await internetGatewayManager.attachInternetGateway(internetGatewayTagName, vpcTagName);
        expect(await internetGatewayManager.isInternetGatewayAttached(internetGatewayTagName, vpcTagName)).toBeTruthy();
        
        // Create custom route table
        await routeTableManager.createRouteTable(customRouteTableTagName, vpcTagName);
        expect(await routeTableManager.exists(customRouteTableTagName)).toBeTruthy();
        // Attach to public subnet
        await routeTableManager.associateWithSubnet(customRouteTableTagName, publicSubnetTagName);
        expect(await routeTableManager.isAssociatedWithSubnet(customRouteTableTagName, publicSubnetTagName)).toBeTruthy();
        // Add route to igw
        await routeTableManager.addRouteToIGW(customRouteTableTagName, internetGatewayTagName, "0.0.0.0/0");
        expect(await routeTableManager.hasRoute(customRouteTableTagName, "0.0.0.0/0"));

        // TODO: Get Main route table 
        // need to be able to get a VPC's main RouteTable, and it also needs to have a TagName
        // TODO: Add route to nat instance

        // Dissociate custom route table from public subnet
        await routeTableManager.dissociateFromAllSubnets(customRouteTableTagName);
        expect(await routeTableManager.isAssociatedWithSubnet(customRouteTableTagName, publicSubnetTagName)).toBeFalsy();
        // Delete custom route table
        await routeTableManager.deleteRouteTable(customRouteTableTagName);
        expect(await routeTableManager.exists(customRouteTableTagName)).toBeFalsy();

        // Detach internet gateway from the VPC
        await internetGatewayManager.detachInternetGateway(internetGatewayTagName, vpcTagName);
        expect(await internetGatewayManager.isInternetGatewayAttached(internetGatewayTagName, vpcTagName)).toBeFalsy();

        // Delete internet gateway
        await internetGatewayManager.deleteInternetGateway(internetGatewayTagName);
        expect(await internetGatewayManager.existInternetGateway(internetGatewayTagName)).toBeFalsy();

        // Delete private subnet
        await subnetManager.deleteSubnet(privateSubnetTagName);
        expect(await subnetManager.exists(privateSubnetTagName)).toBeFalsy();

        // Delete public subnet
        await subnetManager.deleteSubnet(publicSubnetTagName);
        expect(await subnetManager.exists(publicSubnetTagName)).toBeFalsy();

        // Delete VPC
        await vpcManager.deleteVpc(vpcTagName);
        expect(await vpcManager.exists(vpcTagName)).toBeFalsy();
    })
});