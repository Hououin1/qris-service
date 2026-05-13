import express from "express";

import routes from "./routes";
import { loadSavedAuthToken } from "./services/orderkuota.service";
import { loadOrders } from "./store/orderStore";
import { errorHandler } from "./utils/errorHandler";
import { env } from "./utils/env";

const app = express();

app.use(express.json());
app.use(routes);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await loadSavedAuthToken();
  await loadOrders();

  app.listen(env.port, () => {
    console.log(
      `Server is running on port ${env.port} in ${env.nodeEnv} mode`,
    );
  });
};

startServer().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
