import { createLogger, format, transports } from "winston";
const { combine, timestamp, label, printf } = format;

export const logger = createLogger({
  format: combine(
    label({ label: "hub-spid-login-ms" }),
    timestamp(),
    format.splat(),
    printf(
      info => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
    )
  ),
  level: process.env.NODE_ENV !== "prod" ? "debug" : "info",
  transports: [new transports.Console()]
});
