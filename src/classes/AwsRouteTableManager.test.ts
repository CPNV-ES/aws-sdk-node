import { AwsRouteTableManager} from "./AwsRouteTableManager";
import { AwsVpcManager} from "./AwsVpcManager";
import { config } from "../config";

const profileName = "";
const regionEndpint = config.AWS_REGION;
const routeTableTagName = "RTB-pub-VIR1NODE-test";
const vpcTagName = "VIR1NODE-routeTableTests";
const cidrBlock = "10.0.0.0/16";

let vpcManager: AwsVpcManager;
let routeTableManager: AwsRouteTableManager;

beforeEach(async () => {
  vpcManager = new AwsVpcManager(profileName, regionEndpint);
  routeTableManager = new AwsRouteTableManager(profileName, regionEndpint, vpcManager);

  await vpcManager.createVpc(vpcTagName, cidrBlock);

  jest.setTimeout(10000);
});

afterEach(async () => {
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
});

describe("AwsRouteTable integration tests", () => {
  test("Scenari nominal case success", async () => {
    await routeTableManager.createRouteTable(routeTableTagName, vpcTagName);

    expect(await routeTableManager.exists(routeTableTagName)).toBeTruthy();
  });
});
