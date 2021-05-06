import appInsights = require("applicationinsights");
import * as http from "http";
import { createAppTask } from "./app";

appInsights.setup().start();

// tslint:disable-next-line: no-let
let server: http.Server;
// tslint:disable-next-line: no-console
createAppTask
  .run()
  .then(app => {
    server = http.createServer(app).listen(8080);
  })
  // tslint:disable-next-line: no-console
  .catch(e => console.error("Application error: ", e));
