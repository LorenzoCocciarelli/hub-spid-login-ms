import {
  IResponseErrorInternal,
  ResponseErrorInternal
} from "@pagopa/ts-commons/lib/responses";
import express = require("express");
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { Errors } from "io-ts";
import * as t from "io-ts";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { pipe } from "fp-ts/lib/function";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import {
  CommonTokenUser,
  FISCAL_NUMBER_INTERNATIONAL_PREFIX,
  SpidUser,
  TokenUser,
  TokenUserL2,
  UserCompany
} from "../types/user";

export const errorsToError = (errors: Errors): Error =>
  new Error(errorsToReadableMessages(errors).join(" / "));

export const toCommonTokenUser = (
  from: SpidUser
): E.Either<Error, CommonTokenUser> => {
  const normalizedUser = {
    ...from,
    fiscalNumber: from.fiscalNumber.replace(
      FISCAL_NUMBER_INTERNATIONAL_PREFIX,
      ""
    )
  };
  return pipe(
    {
      email: normalizedUser.email,
      family_name: normalizedUser.familyName,
      fiscal_number: normalizedUser.fiscalNumber,
      mobile_phone: normalizedUser.mobilePhone,
      name: normalizedUser.name
    },
    CommonTokenUser.decode,
    E.mapLeft(errorsToError)
  );
};

export const toTokenUserL2 = (
  from: TokenUser,
  company: UserCompany
): E.Either<Error, TokenUserL2> =>
  pipe(
    {
      company,
      email: from.email,
      family_name: from.family_name,
      fiscal_number: from.fiscal_number,
      from_aa: from.from_aa,
      mobile_phone: from.mobile_phone,
      name: from.name
    },
    TokenUserL2.decode,
    E.mapLeft(errorsToError)
  );

export const toResponseErrorInternal = (err: Error): IResponseErrorInternal =>
  ResponseErrorInternal(err.message);

export const toBadRequest = (res: express.Response) => (
  errs: Error | Errors,
  message: string = ""
): express.Response =>
  res.status(400).json({
    detail: errs instanceof Error ? errs.message : errorsToError(errs).message,
    error: "Bad Request",
    message
  });

export const mapDecoding = <S, A>(
  type: t.Type<A, S>,
  toDecode: unknown
): TE.TaskEither<Error, A> =>
  pipe(toDecode, type.decode, E.mapLeft(errorsToError), TE.fromEither);

export const toRequestId = (user: Record<string, unknown>): NonEmptyString =>
  user.inResponseTo as NonEmptyString;
