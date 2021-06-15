import { AwsRouteTableManager, RouteTableAssociationAlreadyExistsError} from "./AwsRouteTableManager";
import { AwsVpcManager} from "./AwsVpcManager";
import { AwsSubnetManager, CidrBlockImpossible } from './AwsSubnetManager';
import { AwsInternetGateway } from './AwsInternetGateway';
import EC2Client from "aws-sdk/clients/ec2";

const client = new EC2Client({ region: process.env.AWS_REGION });
const routeTableTagName = "RTB-pub-VIR1NODE-test";
const subnetTagName = "SUB-routeTableTests";
const vpcTagName = "VIR1NODE-routeTableTests";
const igwTagName = "IGW-routeTableTests";
const diffNetworkIgwTagName = "IGW-routeTableTestsDiffNetwork";
const vpcCidrBlock = "10.0.0.0/16";
const routeCirdBlock = "0.0.0.0/0";

let vpcManager: AwsVpcManager;
let subnetManager: AwsSubnetManager;
let routeTableManager: AwsRouteTableManager;
let igwManager: AwsInternetGateway;

const cleanup = async () => {
  if (await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)) {
    await routeTableManager.dissociateFromSubnet(routeTableTagName, subnetTagName);
  }

  if (await subnetManager.exists(subnetTagName)) {
    await subnetManager.deleteSubnet(subnetTagName);
  }
  
  if (await routeTableManager.exists(routeTableTagName)) {
    await routeTableManager.deleteRouteTable(routeTableTagName);
  }

  if(await igwManager.existInternetGateway(igwTagName)) {
    await igwManager.detachInternetGateway(igwTagName, vpcTagName);
    await igwManager.deleteInternetGateway(igwTagName);
  }

  if(await igwManager.existInternetGateway(diffNetworkIgwTagName)) {
    await igwManager.deleteInternetGateway(diffNetworkIgwTagName);
  }
  
  if (await vpcManager.exists(vpcTagName)) {
    await vpcManager.deleteVpc(vpcTagName);
  }
}

beforeAll(async () => {
  vpcManager = new AwsVpcManager(client);
  subnetManager = new AwsSubnetManager(client, vpcManager);
  igwManager = new AwsInternetGateway(client);
  routeTableManager = new AwsRouteTableManager(client, vpcManager, subnetManager, igwManager);

  await cleanup();

  await vpcManager.createVpc(vpcTagName, vpcCidrBlock);
  await subnetManager.createSubnet(subnetTagName, vpcTagName, vpcCidrBlock);
  await igwManager.createInternetGateway(igwTagName);
  await igwManager.attachInternetGateway(igwTagName, vpcTagName);
  await igwManager.createInternetGateway(diffNetworkIgwTagName);  // this igw is not attached to any network
});

afterEach(async () => {
  if (await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)) {
    await routeTableManager.dissociateFromSubnet(routeTableTagName, subnetTagName);
  }

  if (await routeTableManager.hasRoute(routeTableTagName, routeCirdBlock)) {
    await routeTableManager.deleteRoute(routeTableTagName, routeCirdBlock);
  }

  if (await routeTableManager.exists(routeTableTagName)) {
    await routeTableManager.deleteRouteTable(routeTableTagName);
  }
});

afterAll(async () => {
  await cleanup();
});

describe("AwsRouteTable unit tests", () => {
  test("Create RouteTable nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeTruthy();
  });

  test("Create RouteTable already exists throws exception", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    // as described here : https://stackoverflow.com/a/47887098/10596952
    await expect(routeTableManager.createRouteTable(routeTableTagName, vpcTagName)).rejects.toThrow(RouteTableAssociationAlreadyExistsError);
  });

  test("Delete RouteTable nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    await routeTableManager.deleteRouteTable(routeTableTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeFalsy();
  });

  test("RouteTable Exists nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeTruthy();
  });

  test("Associate RouteTable with Subnet nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);
    await routeTableManager.associateWithSubnet(routeTableTagName, subnetTagName);

    expect(await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)).toBeTruthy();
  });

  test("RouteTable Subnet dissociation nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);
    await routeTableManager.associateWithSubnet(routeTableTagName, subnetTagName);
    await routeTableManager.dissociateFromSubnet(routeTableTagName, subnetTagName);

    expect(await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)).toBeFalsy();
  });

  test("Create route to InternetGateway", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);
    await routeTableManager.addRouteToIGW(routeTableTagName, igwTagName, routeCirdBlock);

    expect(await routeTableManager.hasRoute(routeTableTagName, routeCirdBlock)).toBeTruthy();
  });

  test("Delete route to InternetGateway", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);
    await routeTableManager.addRouteToIGW(routeTableTagName, igwTagName, routeCirdBlock);
    await routeTableManager.deleteRoute(routeTableTagName, routeCirdBlock);

    expect(await routeTableManager.hasRoute(routeTableTagName, routeCirdBlock)).toBeFalsy();
  });

  test("RouteTable needs to be in the same network as IGW to create route", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    await expect(
      routeTableManager.addRouteToIGW(routeTableTagName, diffNetworkIgwTagName, routeCirdBlock)
    ).rejects.toThrow("belong to different networks");
  });
});