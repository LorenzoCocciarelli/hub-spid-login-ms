import { Either, isLeft, left, right, toError } from "fp-ts/lib/Either";
import { fromNullable, Option } from "fp-ts/lib/Option";
import { fromEither, TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import { RedisClient } from "redis";

/**
 * Parse a Redis single string reply.
 *
 * @see https://redis.io/topics/protocol#simple-string-reply.
 */
export const singleStringReply = (
  err: Error | null,
  reply: "OK" | undefined
): Either<Error, boolean> => {
  if (err) {
    return left<Error, boolean>(err);
  }

  return right<Error, boolean>(reply === "OK");
};

/**
 * Parse a Redis single string reply.
 *
 * @see https://redis.io/topics/protocol#simple-string-reply.
 */
export const singleValueReply = (
  err: Error | null,
  reply: string | null
): Either<Error, Option<string>> => {
  if (err) {
    return left<Error, Option<string>>(err);
  }
  return right<Error, Option<string>>(fromNullable(reply));
};

/**
 * Parse a Redis integer reply.
 *
 * @see https://redis.io/topics/protocol#integer-reply
 */
export const integerReply = (
  err: Error | null,
  reply: unknown,
  expectedReply?: number
): Either<Error, boolean> => {
  if (err) {
    return left<Error, boolean>(err);
  }
  if (expectedReply !== undefined && expectedReply !== reply) {
    return right<Error, boolean>(false);
  }
  return right<Error, boolean>(typeof reply === "number");
};

export const falsyResponseToError = (
  response: Either<Error, boolean>,
  error: Error
): Either<Error, true> => {
  if (isLeft(response)) {
    return left(response.value);
  } else {
    if (response.value) {
      return right(true);
    }
    return left(error);
  }
};

export const setWithExpirationTask = (
  redisClient: RedisClient,
  key: string,
  value: string,
  expirationInSeconds: number,
  errorMsg?: string
): TaskEither<Error, true> =>
  tryCatch(
    () =>
      new Promise<Either<Error, true>>(resolve =>
        redisClient.set(
          key,
          value,
          "EX",
          expirationInSeconds,
          (err, response) =>
            resolve(
              falsyResponseToError(
                singleStringReply(err, response),
                new Error(
                  errorMsg ? errorMsg : "Error setting key value pair on redis"
                )
              )
            )
        )
      ),
    toError
  ).chain(fromEither);

export const setTask = (
  redisClient: RedisClient,
  key: string,
  value: string,
  errorMsg?: string
): TaskEither<Error, true> =>
  tryCatch(
    () =>
      new Promise<Either<Error, true>>(resolve =>
        redisClient.set(key, value, (err, response) =>
          resolve(
            falsyResponseToError(
              singleStringReply(err, response),
              new Error(
                errorMsg ? errorMsg : "Error setting key value pair on redis"
              )
            )
          )
        )
      ),
    toError
  ).chain(fromEither);

export const deleteTask = (redisClient: RedisClient, key: string) =>
  tryCatch(
    () =>
      new Promise<Either<Error, boolean>>(resolve =>
        redisClient.del(key, (err, response) =>
          resolve(
            falsyResponseToError(
              integerReply(err, response),
              new Error("Error deleting key value pair on redis")
            )
          )
        )
      ),
    toError
  ).chain(fromEither);

export const getTask = (
  redisClient: RedisClient,
  key: string
): TaskEither<Error, Option<string>> =>
  tryCatch(
    () =>
      new Promise<Either<Error, Option<string>>>(resolve =>
        redisClient.get(key, (err, response) =>
          resolve(singleValueReply(err, response))
        )
      ),
    toError
  ).chain(fromEither);

export const existsKeyTask = (
  redisClient: RedisClient,
  key: string
): TaskEither<Error, boolean> =>
  tryCatch(
    () =>
      new Promise<Either<Error, boolean>>(resolve =>
        redisClient.exists(key, (err, response) =>
          resolve(integerReply(err, response, 1))
        )
      ),
    toError
  ).chain(fromEither);
