import { AwsRouteTableManager, RouteTableAssociationAlreadyExistsError} from "./AwsRouteTableManager";
import { AwsVpcManager} from "./AwsVpcManager";
import { AwsSubnetManager } from './AwsSubnetManager';
import { config } from "../config";

const profileName = "";
const regionEndpint = config.AWS_REGION;
const routeTableTagName = "RTB-pub-VIR1NODE-test";
const subnetTagName = "SUB-routeTableTests";
const vpcTagName = "VIR1NODE-routeTableTests";
const cidrBlock = "10.0.0.0/16";

let vpcManager: AwsVpcManager;
let subnetManager: AwsSubnetManager;
let routeTableManager: AwsRouteTableManager;

beforeAll(async () => {
  vpcManager = new AwsVpcManager(profileName, regionEndpint);
  subnetManager = new AwsSubnetManager(regionEndpint, vpcManager);
  routeTableManager = new AwsRouteTableManager(profileName, regionEndpint, vpcManager, subnetManager);

  if (await subnetManager.exists(subnetTagName)) {
    await subnetManager.deleteSubnet(subnetTagName);
  }

  if (await routeTableManager.exists(routeTableTagName)) {
    await routeTableManager.deleteRouteTable(routeTableTagName);
  }
  
  if (await vpcManager.exists(vpcTagName)) {
    await vpcManager.deleteVpc(vpcTagName);
  }

  await vpcManager.createVpc(vpcTagName, cidrBlock);
  await subnetManager.createSubnet(subnetTagName, vpcTagName, cidrBlock);
});

afterEach(async () => {
  if (await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)) {
    await routeTableManager.dissociateFromSubnet(routeTableTagName, subnetTagName);
  }

  if (await routeTableManager.exists(routeTableTagName)) {
    await routeTableManager.deleteRouteTable(routeTableTagName);
  }
});

afterAll(async () => {
  if (await routeTableManager.isAssociatedWithSubnet(routeTableTagName, subnetTagName)) {
    await routeTableManager.dissociateFromSubnet(routeTableTagName, subnetTagName);
  }

  if (await subnetManager.exists(subnetTagName)) {
    await subnetManager.deleteSubnet(subnetTagName);
  }
  
  if (await routeTableManager.exists(routeTableTagName)) {
    await routeTableManager.deleteRouteTable(routeTableTagName);
  }
  
  if (await vpcManager.exists(vpcTagName)) {
    await vpcManager.deleteVpc(vpcTagName);
  }
});

describe("AwsRouteTable unit tests", () => {
  test("Create RouteTable nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeTruthy();
  });

  test("Create RouteTable already exists throws exception", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    // as described here : https://stackoverflow.com/a/47887098/10596952
    await expect(routeTableManager.createRouteTable(routeTableTagName, vpcTagName)).rejects.toThrow();
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

  test("Associate RouteTable with Subnet nomnial case success", async () => {
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
});

describe("AwsRouteTable integration tests", () => {
  test("Scenari nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeTruthy();
  });
});
