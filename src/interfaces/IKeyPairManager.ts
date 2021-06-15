interface IKeyPairManager {
  create(keyName: string): Promise<void>;

  delete(keyName: string): Promise<void>;
}
