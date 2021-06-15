import EC2Client from "aws-sdk/clients/ec2";

/**
 * @export
 * @class AwsKeyPairManager
 * @implements {IKeyPairManager}
 */
export class AwsKeyPairManager implements IKeyPairManager {
  /**
   * @private
   * @type {EC2Client}
   * @memberof AwsKeyPairManager
   */
  private client: EC2Client;

  /**
   * @param {string} awsRegionEndpoint
   * @memberof AwsKeyPairManager
   */
  constructor(awsRegionEndpoint: string) {
    this.client = new EC2Client({ region: awsRegionEndpoint });
  }

  /**
   * @param {string} keyName
   * @return {Promise<void>}
   * @throws {DuplicateKeyPairError} If key pair already exists
   * @memberof AwsKeyPairManager
   */
  async create(keyName: string): Promise<void> {
    try {
      await this.client.createKeyPair({ KeyName: keyName }).promise();
    } catch (e) {
      if (e.code === "InvalidKeyPair.Duplicate") {
        throw new DuplicateKeyPairError(keyName);
      }

      throw e;
    }
  }

  /**
   * @param {string} keyName
   * @return {Promise<void>}
   * @throws {NotFoundKeyPairError} If the key pair was not found
   * @memberof AwsKeyPairManager
   */
  async delete(keyName: string): Promise<void> {
    try {
      await this.client.deleteKeyPair({ KeyName: keyName }).promise();
    } catch (e) {
      console.error(e);
      if (e.code === "InvalidKeyPair.NotFound") {
        throw new NotFoundKeyPairError(keyName);
      }

      throw e;
    }
  }

  /**
   * @param {string} keyName
   * @return {Promise<boolean>} If the key pair with the given name exists
   * @memberof AwsKeyPairManager
   */
  async exists(keyName: string): Promise<boolean> {
    const keyPairs = await this.describe([keyName]);

    if (!keyPairs || !keyPairs[0]) {
      return false;
    }

    return true;
  }

  private async describe(keyNames: string[]): Promise<EC2Client.KeyPairList> {
    let keyPairs: EC2Client.KeyPairList = [];

    try {
      const result = await this.client
        .describeKeyPairs({
          KeyNames: keyNames,
        })
        .promise();

      keyPairs = result.KeyPairs ?? [];
    } finally {
      // eslint-disable-next-line no-unsafe-finally
      return keyPairs;
    }
  }
}

/**
 * @export
 * @class DuplicateKeyPairError
 * @extends {Error}
 */
export class DuplicateKeyPairError extends Error {
  constructor(keyName: string) {
    super(`The key pair with the name: ${keyName} already exists`);
  }
}

/**
 * @export
 * @class NotFoundKeyPairError
 * @extends {Error}
 */
export class NotFoundKeyPairError extends Error {
  constructor(keyName: string) {
    super(`The key pair with the name: ${keyName} was not found`);
  }
}
