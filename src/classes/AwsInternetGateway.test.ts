import { AwsInternetGateway } from "./AwsInternetGateway";
import { AwsVpcManager } from "./AwsVpcManager";
import { config } from "../config";
const regionEndpint = config.AWS_REGION;
const igwTagName = "IGW_test";
const vpcTagName = "VPC_test";
const cidrBlock = "10.0.0.0/16";

let internetGateway: AwsInternetGateway;
let vpcManager: AwsVpcManager;

beforeEach(() => {
    internetGateway = new AwsInternetGateway(regionEndpint);
    vpcManager = new AwsVpcManager(regionEndpint);

    jest.setTimeout(60000);
});

afterEach(async () => {
    if (await internetGateway.existInternetGateway(igwTagName)) {
        await internetGateway.deleteInternetGateway(igwTagName);
    }
    if (await vpcManager.exists(vpcTagName)) {
        await vpcManager.deleteVpc(vpcTagName);
    }
});

describe("InternetGateway unit tests", () => {
    test("Create Internet Gateway and verify if it exists", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeTruthy();
    });

    test("Create two IGWs and throws an exception when the second one is created", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        // as described here : https://stackoverflow.com/a/47887098/10596952
        await expect(internetGateway.createInternetGateway(igwTagName)).rejects.toThrow();
    });

    test("Delete the IGW", async () => {
        await internetGateway.createInternetGateway(igwTagName);

        await internetGateway.deleteInternetGateway(igwTagName);

        expect(await internetGateway.existInternetGateway(igwTagName)).toBeFalsy();
    });
});

describe("InternetGateWay integration tests", () => {
    test("Attach and detach a VPC to an IGW", async () => {
        await internetGateway.createInternetGateway(igwTagName);
        await vpcManager.createVpc(vpcTagName, cidrBlock);

        await internetGateway.attachInternetGateway(igwTagName, vpcTagName);
        expect(await internetGateway.isInternetGatewayAttached(igwTagName, vpcTagName)).toBeTruthy();
        
        await internetGateway.detachInternetGateway(igwTagName, vpcTagName);
        expect(await internetGateway.isInternetGatewayAttached(igwTagName, vpcTagName)).toBeFalsy();
    });
});
