import { AwsKeyPairManager } from "./AwsKeyPairManager";

const regionEndpoint = process.env.AWS_REGION ?? "";
const keyName = "keypair";

const keyPairManager = new AwsKeyPairManager(regionEndpoint);

const cleanup = async () => {
  if (await keyPairManager.exists(keyName)) {
    await keyPairManager.delete(keyName);
  }
};

beforeAll(async () => {
  await cleanup();
});

afterAll(async () => {
  await cleanup();
});

afterEach(async () => {
  await cleanup();
});

describe("AwsKeyPairManager unit tests", () => {
  test("Create KeyPair nominal case success", async () => {
    await keyPairManager.create(keyName);

    expect(await keyPairManager.exists(keyName)).toBeTruthy();
  });

  test("Create KeyPair already exists throws exception", async () => {
    await keyPairManager.create(keyName);

    // as described here : https://stackoverflow.com/a/47887098/10596952
    await expect(keyPairManager.create(keyName)).rejects.toThrow();
  });

  test("Delete KeyPair nominal case success", async () => {
    await keyPairManager.create(keyName);
    await keyPairManager.delete(keyName);

    expect(await keyPairManager.exists(keyName)).toBeFalsy();
  });
});
