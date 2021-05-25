import dotenv from "dotenv";

export default (): void => {
  dotenv.config({
    path: ".env.test",
  });
};
