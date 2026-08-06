const createApp = require("./config/app");
const config = require("./config");

const app = createApp();

app.listen(config.server.port, () => {
  console.log(
    `Warranty Failure Management System running on port ${config.server.port}`,
  );
});
