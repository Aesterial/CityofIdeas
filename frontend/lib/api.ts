import { create } from "@bufbuild/protobuf";
import { Code, ConnectError } from "@connectrpc/connect";
import { EmptySchema, timestampDate, timestampFromDate, } from "@bufbuild/protobuf/wkt";
import { buildApiUrl } from "@/lib/api-base";
import {
  AuthorizeRequestSchema,
  CallbackType,
  RegisterRequestSchema,
  TgCallbackRequestSchema,
  TgStartRequestSchema,
  VkCallbackRequestSchema,
  VkStartRequestSchema,
  type VkCallbackResponse as GrpcOAuthCallbackResponse,
} from "@/gen/xyz/city_ideas/v1/login/v1/domain_pb";
import {
  CreateMessageRequestSchema as ProjectCreateMessageRequestSchema,
  CreateProjectRequestSchema,
  type Message as GrpcProjectMessage,
  type Project as GrpcProject,
  ProjectLocationSchema,
  type Submission as GrpcSubmission,
} from "@/gen/xyz/city_ideas/v1/projects/v1/domain_pb";
import {CreateRequestSchema as RankCreateRequestSchema, RankSchema, AssignRankRequestSchema,} from "@/gen/xyz/city_ideas/v1/ranks/v1/domain_pb";
import { Purpose as StoragePurpose } from "@/gen/xyz/city_ideas/v1/storage/v1/domain_pb";
import { GetUploadURLRequestSchema } from "@/gen/xyz/city_ideas/v1/storage/v1/service_pb";
import {
  CreateRequestSchema as MaintenanceCreateRequestSchema,
  TimeRangeSchema,
} from "@/gen/xyz/city_ideas/v1/maintenances/v1/domain_pb";
import {
  CreateTicketRequestSchema,
  type Message as GrpcTicketMessage,
  type Ticket as GrpcTicket,
} from "@/gen/xyz/city_ideas/v1/tickets/v1/domain_pb";
import {
  type Global as GrpcGlobal,
  type Graph as GrpcGraph,
  RequestByCitySchema,
  Separator,
  SeparatorValueSchema,
} from "@/gen/xyz/city_ideas/v1/statistics/v1/domain_pb";
import {
  RequestWithLimitAndOffsetAndValueSchema,
  RequestWithLimitAndOffsetSchema,
  RequestWithValueSchema,
  RequestWithValuesSchema,
} from "@/gen/xyz/city_ideas/v1/types_pb";
import {
  Reset,
  ResetTotpRequestSchema,
} from "@/gen/xyz/city_ideas/v1/login/v1/domain_pb";
import {
  BanRequestSchema,
  type PublicUser as GrpcPublicUser,
  UpdatePreferencesRequestSchema,
} from "@/gen/xyz/city_ideas/v1/user/v1/domain_pb";
import {
  citiesClient,
  loginClient,
  maintenanceClient,
  projectsClient,
  rankClient,
  sessionClient,
  statisticClient,
  storageClient,
  ticketClient,
  userClient,
} from "./grpc-web";
import {emitMfaRequired, isMfaRequiredMessage} from "@/lib/mfa-required";
import {StatusCodes} from "http-status-codes";

export { Separator as StatisticsSeparator };

export type RegisterPayload = {
  username: string;
  password: string;
  email: string;
};

export type AuthorizationPayload = {
  usermail: string;
  password: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetPayload = {
  email: string;
  password: string;
  token: string;
};

type ApiEmail = {
  address: string;
  verified: boolean;
};

export type ApiRank = {
  name: string;
  expires?: string | null;
};

export type ApiRankListItem = {
  name: string;
  description?: string;
  color?: number;
  added?: string;
  weight?: number;
};

export type ApiAvatar = {
  contentType?: string;
  data?: string;
  url?: string;
  key?: string;
};

type PresignResponse = {
  presign?: string;
  tracing?: string;
};

export type AvatarUploadPayload = {
  userId: number | string;
  file: File;
  contentType?: string;
  key?: string;
};

type ApiUserSettings = {
  display_name?: string | null;
  displayName?: string | null;
  description?: string | null;
  description_text?: string | null;
  descriptionText?: string | null;
  session_live_time?: number | null;
  sessionLiveTime?: number | null;
  avatar?: ApiAvatar | null;
  totp_enabled?: boolean | null;
  totpEnabled?: boolean | null;
  mfa_enabled?: boolean | null;
  mfaEnabled?: boolean | null;
  two_factor_enabled?: boolean | null;
  twoFactorEnabled?: boolean | null;
};

export type ApiUserPublic = {
  uid?: number | string;
  userID?: number | string;
  username?: string;
  settings?: ApiUserSettings | null;
  rank?: ApiRank | null;
  joined?: string;
  joinedAt?: string;
  banned?: boolean;
};

export type ApiPermissions = {
  all?: boolean;
  tickets?: {
    viewList?: { any?: boolean };
    view_list?: { any?: boolean };
    accept?: boolean;
  };
  submissions?: { view?: boolean; accept?: boolean; decline?: boolean };
  statistics?: { all?: boolean };
  users?: {
    moderation?: {
      all?: boolean;
      ban?: boolean;
      banForever?: boolean;
      ban_forever?: boolean;
      unban?: boolean;
    };
  };
  ranks?: {
    all?: boolean;
    permsChange?: boolean;
    permissionsChange?: boolean;
    permissions_change?: boolean;
  };
  [key: string]: unknown;
};

export type ApiProjectLocation = {
  city?: string;
  street?: string;
  house?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  coordinates?: [number, number] | [string, string];
};

export type ApiProjectInfo = {
  title?: string;
  description?: string;
  photos?: ApiAvatar[] | null;
  category?: string | number;
  location?: ApiProjectLocation | null;
};

export type ApiProject = {
  id?: string;
  author?: ApiUserPublic | null;
  info?: ApiProjectInfo | null;
  details?: ApiProjectInfo | null;
  likesCount?: number;
  likes_count?: number;
  liked?: ApiUserPublic[] | null;
  createdAt?: string | { seconds?: number | string; nanos?: number } | null;
  created_at?: string | { seconds?: number | string; nanos?: number } | null;
  status?: string | number;
};

export type ApiSubmissionTarget = {
  id?: number | string;
  info?: ApiProject | null;
  state?: string;
  reason?: string | null;
};

export type ApiNotification = {
  id: string;
  type?: string;
  scope?: string;
  body?: string;
  createdAt?: string;
  expiresAt?: string | null;
  readAt?: string | null;
};

export type MaintenanceScope = "all" | "auth" | "projects";

export type ApiMaintenanceData = {
  id?: string;
  description?: string;
  willEnd?: string;
};

type ApiUser = {
  uid?: number;
  userID?: number;
  username?: string;
  public?: ApiUserPublic | null;
  email?: ApiEmail | null;
  settings?: ApiUserSettings | null;
  rank?: ApiRank | null;
  joined?: string;
  joinedAt?: string;
};

type ApiUserResponse = {
  data?: ApiUser | null;
  tracing?: string;
};

type ApiUserPublicResponse = {
  data?: ApiUserPublic | null;
  tracing?: string;
};

type ApiPermissionsResponse = {
  data?: ApiPermissions | null;
  tracing?: string;
};

type ApiRankListEntry = {
  name?: string;
  description?: string;
  color?: number;
  added?: string | { seconds?: number | string; nanos?: number } | null;
  weight?: number;
};

type ApiRankListResponse = {
  ranks?: ApiRankListEntry[] | null;
  data?: ApiRankListEntry[] | null;
  items?: ApiRankListEntry[] | null;
  tracing?: string;
};

type ApiRankUsersResponse = {
  len?: number;
  users?: ApiUserPublic[] | null;
  tracing?: string;
};

type ApiProjectCategoriesResponse = {
  categories?: string[] | null;
  tracing?: string;
};

export type ApiTicket = Record<string, unknown>;
export type ApiTicketMessage = Record<string, unknown>;

export type CreateTicketPayload = {
  name?: string;
  email?: string;
  topic: string;
  brief: string;
  content: string;
};

type ApiBanInfoResponse = {
  id?: string;
  reason?: string;
  at?: string;
  expires?: string | null;
  tracing?: string;
};

export type AuthUser = {
  uid: number | string;
  username: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  description?: string;
  avatar?: ApiAvatar | null;
  rank?: ApiRank | null;
  totpEnabled?: boolean;
  joined?: string;
};

export type AuthChallengeType = "totp" | "email" | "unknown";

export type AuthChallenge = {
  type: AuthChallengeType;
  token?: string;
  verifyUrl?: string;
  resendUrl?: string;
  destination?: string;
  expiresAt?: string;
  length?: number;
  redirectUrl?: string;
  loginMethod?: "password" | "vk";
};

export type AuthResult = {
  status: "ok" | "challenge";
  challenge?: AuthChallenge;
  redirectUrl?: string;
};

export type TotpEnrollment = {
  secret?: string;
  otpauthUrl?: string;
  qrBase64?: string;
  manualUrl?: string;
  token?: string;
  digits?: number;
  period?: number;
};

export type TotpConfirmResult = {
  recoveryCodes: string[];
};

export type UserSession = {
  id: string;
  createdAt?: string;
  lastSeenAt?: string;
  hash?: string;
};

export type UserID = number | string;

export type UserListItem = {
  userID: UserID;
  username: string;
  displayName?: string;
  avatar?: ApiAvatar | null;
  banned: boolean;
  rank?: ApiRank | null;
  joined?: string;
};

export type BanInfo = {
  id?: string;
  reason?: string;
  at?: string;
  expires?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class MfaRequiredError extends ApiError {
  constructor(message: string) {
    super(StatusCodes.FORBIDDEN, message);
  }
}

function isApiUserResponse(
  payload: ApiUser | ApiUserResponse,
): payload is ApiUserResponse {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

function isApiUserPublicResponse(
  payload: ApiUserPublic | ApiUserPublicResponse,
): payload is ApiUserPublicResponse {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

function isPermissionsResponse(
  payload: ApiPermissions | ApiPermissionsResponse,
): payload is ApiPermissionsResponse {
  return typeof payload === "object" && payload !== null && "data" in payload;
}

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const pickString = (
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): string | undefined => {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const pickBoolean = (
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): boolean | undefined => {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
};

const pickNumber = (
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): number | undefined => {
  if (!record) {
    return undefined;
  }
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
};

function toAvatar(value: unknown): ApiAvatar | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const payload = value as {
    contentType?: unknown;
    content_type?: unknown;
    data?: unknown;
    url?: unknown;
    key?: unknown;
  };
  const contentType =
    (typeof payload.contentType === "string" && payload.contentType.trim()) ||
    (typeof payload.content_type === "string" && payload.content_type.trim()) ||
    undefined;
  const data =
    typeof payload.data === "string" ? payload.data.trim() : undefined;
  const url = typeof payload.url === "string" ? payload.url.trim() : undefined;
  const key = typeof payload.key === "string" ? payload.key.trim() : undefined;
  if (!contentType && !data && !url && !key) {
    return undefined;
  }
  return {
    ...(contentType ? { contentType } : {}),
    ...(data ? { data } : {}),
    ...(url ? { url } : {}),
    ...(key ? { key } : {}),
  };
}

const toRankAdded = (value: ApiRankListEntry["added"]): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value !== "object") {
    return undefined;
  }
  const secondsRaw = value.seconds;
  const seconds =
    typeof secondsRaw === "number"
      ? secondsRaw
      : typeof secondsRaw === "string"
        ? Number(secondsRaw)
        : NaN;
  if (!Number.isFinite(seconds)) {
    return undefined;
  }
  return new Date(seconds * 1000).toISOString();
};

const normalizeMaintenanceScope = (
  value?: string | null,
): MaintenanceScope | undefined => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }
  if (normalized === "all") {
    return "all";
  }
  if (normalized === "auth") {
    return "auth";
  }
  if (normalized === "projects") {
    return "projects";
  }
  return undefined;
};

const readMaintenanceFlag = (payload: unknown): boolean => {
  if (typeof payload === "boolean") {
    return payload;
  }
  const record = toRecord(payload);
  if (!record) {
    return false;
  }
  const direct = pickBoolean(record, [
    "has",
    "active",
    "planned",
    "enabled",
    "maintenance",
    "data",
  ]);
  if (typeof direct === "boolean") {
    return direct;
  }
  const nested = toRecord(record.data);
  const nestedValue = pickBoolean(nested, [
    "has",
    "active",
    "planned",
    "enabled",
    "maintenance",
  ]);
  if (typeof nestedValue === "boolean") {
    return nestedValue;
  }
  const numeric = pickNumber(record, [
    "has",
    "active",
    "planned",
    "enabled",
    "maintenance",
  ]);
  return typeof numeric === "number" ? numeric > 0 : false;
};

const toIsoInputDateTime = (value: string, fieldName: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${fieldName} is required.`);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return parsed.toISOString();
};

const toIsoTimestamp = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  const payload = toRecord(value);
  if (!payload) {
    return undefined;
  }
  const secondsRaw = payload.seconds;
  const nanosRaw = payload.nanos;
  const seconds =
    typeof secondsRaw === "number"
      ? secondsRaw
      : typeof secondsRaw === "string"
        ? Number(secondsRaw)
        : NaN;
  if (!Number.isFinite(seconds)) {
    return undefined;
  }
  const nanos =
    typeof nanosRaw === "number"
      ? nanosRaw
      : typeof nanosRaw === "string"
        ? Number(nanosRaw)
        : 0;
  const millis = seconds * 1000 + (Number.isFinite(nanos) ? nanos / 1e6 : 0);
  const date = new Date(millis);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toNotification = (value: unknown): ApiNotification | null => {
  const record = toRecord(value);
  if (!record) {
    return null;
  }
  const id = pickString(record, ["id", "notification_id", "notificationId"]);
  if (!id) {
    return null;
  }

  const type = pickString(record, ["type"]);
  const scope = pickString(record, ["scope"]);
  const body = pickString(record, [
    "body",
    "message",
    "content",
    "text",
    "title",
  ]);
  const createdAt =
    toIsoTimestamp(
      record.created ?? record.created_at ?? record.createdAt ?? null,
    ) ?? undefined;
  const expiresAt =
    toIsoTimestamp(
      record.expires ?? record.expires_at ?? record.expiresAt ?? null,
    ) ?? null;
  const readAt =
    toIsoTimestamp(record.readed ?? record.read_at ?? record.readAt ?? null) ??
    null;

  return {
    id,
    ...(type ? { type } : {}),
    ...(scope ? { scope } : {}),
    ...(body ? { body } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(readAt ? { readAt } : {}),
  };
};

const toNotifications = (payload: unknown): ApiNotification[] => {
  const root = toRecord(payload);
  const items: unknown[] = [];

  const pushCandidate = (value: unknown) => {
    if (Array.isArray(value)) {
      items.push(...value);
      return;
    }
    if (value && typeof value === "object") {
      items.push(value);
    }
  };

  pushCandidate(payload);
  pushCandidate(root?.data);
  pushCandidate(root?.notifications);
  pushCandidate(root?.items);
  pushCandidate(root?.list);

  const map = new Map<string, ApiNotification>();
  for (const item of items) {
    const notification = toNotification(item);
    if (!notification) {
      continue;
    }
    map.set(notification.id, notification);
  }

  return [...map.values()].sort((a, b) => {
    const left = a.createdAt ? Date.parse(a.createdAt) : 0;
    const right = b.createdAt ? Date.parse(b.createdAt) : 0;
    return right - left;
  });
};

const toUserSession = (value: unknown): UserSession | null => {
  const record = toRecord(value);
  if (!record) {
    return null;
  }

  const id = pickString(record, [
    "uuid",
    "id",
    "sessionId",
    "sessionID",
    "session_id",
  ]);
  if (!id) {
    return null;
  }

  const createdAt =
    toIsoTimestamp(
      record.created ?? record.created_at ?? record.createdAt ?? null,
    ) ?? undefined;
  const lastSeenAt =
    toIsoTimestamp(
      record.lastSeen ??
      record.last_seen ??
      record.last_seen_at ??
      record.lastSeenAt ??
      null,
    ) ?? undefined;
  const hash = pickString(record, ["hash", "userAgentHash", "user_agent_hash"]);

  return {
    id,
    ...(createdAt ? { createdAt } : {}),
    ...(lastSeenAt ? { lastSeenAt } : {}),
    ...(hash ? { hash } : {}),
  };
};

const toUserSessions = (payload: unknown): UserSession[] => {
  const root = toRecord(payload);
  const data = toRecord(root?.data);

  const candidates: unknown[] = [
    payload,
    root?.data,
    root?.sessions,
    root?.list,
    data?.sessions,
    data?.data,
    data?.list,
  ];

  const items: unknown[] = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      items.push(...candidate);
    }
  }

  const sessionMap = new Map<string, UserSession>();
  for (const item of items) {
    const session = toUserSession(item);
    if (!session) {
      continue;
    }
    sessionMap.set(session.id, session);
  }

  return [...sessionMap.values()].sort((left, right) => {
    const leftLast = left.lastSeenAt ? Date.parse(left.lastSeenAt) : 0;
    const rightLast = right.lastSeenAt ? Date.parse(right.lastSeenAt) : 0;
    if (rightLast !== leftLast) {
      return rightLast - leftLast;
    }
    const leftCreated = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightCreated = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightCreated - leftCreated;
  });
};

const toRankListItem = (value: ApiRankListEntry): ApiRankListItem | null => {
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    return null;
  }
  const description =
    typeof value.description === "string"
      ? value.description.trim() || undefined
      : undefined;
  const color = typeof value.color === "number" ? value.color : undefined;
  const weight =
    typeof value.weight === "number" && Number.isFinite(value.weight)
      ? value.weight
      : undefined;
  return {
    name,
    description,
    color,
    added: toRankAdded(value.added),
    weight,
  };
};

const BAN_STORAGE_KEY = "banInfo";
const BANNED_ERROR_MATCH = "user is banned";

const includesAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern));

const sanitizeErrorByStatus = (status: number): string => {
  if (
    status === StatusCodes.BAD_REQUEST ||
    status === StatusCodes.UNPROCESSABLE_ENTITY
  ) {
    return "Invalid request data. Please check your input and try again.";
  }
  if (status === StatusCodes.UNAUTHORIZED) {
    return "Authentication required. Please sign in and try again.";
  }
  if (status === StatusCodes.FORBIDDEN) {
    return "Access denied. You do not have permission for this action.";
  }
  if (status === StatusCodes.NOT_FOUND) {
    return "Requested data was not found.";
  }
  if (status === StatusCodes.CONFLICT) {
    return "Data conflict. Please refresh and try again.";
  }
  if (status === StatusCodes.TOO_MANY_REQUESTS) {
    return "Too many requests. Please try again later.";
  }
  if (
    status === StatusCodes.BAD_GATEWAY ||
    status === StatusCodes.SERVICE_UNAVAILABLE ||
    status === StatusCodes.GATEWAY_TIMEOUT
  ) {
    return "Service is temporarily unavailable. Please try again later.";
  }
  if (status >= 500) {
    return "Server error. Please try again later.";
  }
  return "Request failed. Please try again.";
};

export const getPublicApiErrorMessage = (
  status: number,
  rawMessage?: string,
): string => {
  const normalized = rawMessage?.trim().toLowerCase() ?? "";

  if (normalized) {
    if (normalized.includes("mfa required")) {
      return "Additional verification is required.";
    }
    if (normalized.includes(BANNED_ERROR_MATCH)) {
      return "Access to this account is restricted.";
    }
    if (includesAny(normalized, ["record not found", "not found"])) {
      return "Requested data was not found.";
    }
    if (normalized.includes("invalid totp")) {
      return "Invalid authentication code. Please try again.";
    }
    if (
      includesAny(normalized, [
        "invalid arguments",
        "required data missing",
        "passed data expired",
        "invalid argument",
      ])
    ) {
      return "Invalid request data. Please check your input and try again.";
    }
    if (
      includesAny(normalized, [
        "already exists",
        "already used",
        "conflict error",
        "data collides with exists one",
      ])
    ) {
      return "Data conflict. Please refresh and try again.";
    }
    if (
      includesAny(normalized, [
        "permissions denied",
        "failed to authorize",
        "unauthenticated",
      ])
    ) {
      return status === StatusCodes.UNAUTHORIZED
        ? "Authentication required. Please sign in and try again."
        : "Access denied. You do not have permission for this action.";
    }
    if (includesAny(normalized, ["service unavailable", "unavailable"])) {
      return "Service is temporarily unavailable. Please try again later.";
    }
    if (
      includesAny(normalized, [
        "server error while progress",
        "service not configured",
      ])
    ) {
      return "Server error. Please try again later.";
    }
    if (normalized.includes("not implemented")) {
      return "This action is not available right now.";
    }
  }

  return sanitizeErrorByStatus(status);
};

function isBannedResponse(
  status: number,
  data: { error?: string; data?: unknown; message?: string } | null,
  message: string,
): boolean {
  if (status !== 401 && status !== 403) {
    return false;
  }
  const includesBan = (value: unknown) =>
    typeof value === "string" &&
    value.toLowerCase().includes(BANNED_ERROR_MATCH);
  return (
    includesBan(data?.error) ||
    includesBan(data?.data) ||
    includesBan(data?.message) ||
    includesBan(message)
  );
}

const includesMfaRequired = (value: unknown) => isMfaRequiredMessage(value);

const isMfaRequiredPayload = (payload: unknown): boolean => {
  if (includesMfaRequired(payload)) {
    return true;
  }
  const record = toRecord(payload);
  if (!record) {
    return false;
  }
  const required = pickBoolean(record, [
    "mfaRequired",
    "mfa_required",
    "twoFactorRequired",
    "two_factor_required",
    "totpRequired",
    "totp_required",
  ]);
  if (required) {
    return true;
  }
  const text = pickString(record, ["error", "message", "status", "result"]);
  return includesMfaRequired(text);
};

function isMfaRequiredResponse(
  status: number,
  data: { error?: string; data?: unknown; message?: string } | null,
  message: string,
): boolean {
  if (status !== StatusCodes.FORBIDDEN && status !== StatusCodes.UNAUTHORIZED) {
    return false;
  }
  if (includesMfaRequired(message)) {
    return true;
  }
  return (
    isMfaRequiredPayload(data) ||
    isMfaRequiredPayload(data?.data) ||
    includesMfaRequired(data?.error) ||
    includesMfaRequired(data?.message)
  );
}

function toAuthUser(payload: ApiUser | ApiUserResponse): AuthUser {
  const user: ApiUser | null = isApiUserResponse(payload)
    ? (payload.data ?? null)
    : payload;

  if (!user) {
    throw new Error("Missing user payload.");
  }

  const publicUser = user.public ?? undefined;
  const uid = publicUser?.uid ?? publicUser?.userID ?? user.uid ?? user.userID;
  const username = publicUser?.username ?? user.username;

  if (uid == null || !username) {
    throw new Error("Missing user fields.");
  }

  const settings = publicUser?.settings ?? user.settings;
  const displayName =
    settings?.display_name ?? settings?.displayName ?? undefined;
  const description =
    settings?.description ??
    settings?.description_text ??
    settings?.descriptionText ??
    undefined;
  const avatar = toAvatar(settings?.avatar);
  const rank = publicUser?.rank ?? user.rank ?? undefined;
  const joined =
    publicUser?.joined ?? publicUser?.joinedAt ?? user.joined ?? user.joinedAt;
  const emailVerified = user.email?.verified ?? false;
  const settingsRecord = toRecord(settings);
  const userRecord = toRecord(user);
  const publicRecord = toRecord(publicUser);
  const securitySettings = user.settings ?? null;
  const totpEnabled = securitySettings?.totpEnabled ?? false;

  return {
    uid,
    username,
    email: user.email?.address,
    emailVerified,
    displayName,
    description,
    avatar,
    rank,
    totpEnabled,
    joined,
  };
}

const toGrpcTimestamp = (value?: { seconds?: bigint | number | string | null; nanos?: number | null } | null) => {
  if (!value) {
    return undefined;
  }
  try {
    return timestampDate(value as Parameters<typeof timestampDate>[0]).toISOString();
  } catch {
    return undefined;
  }
};

const toSafeNumber = (value: bigint | number | string | undefined | null) => {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toLimitOffsetRequest = (options?: {
  limit?: number;
  offset?: number;
}) =>
  create(RequestWithLimitAndOffsetSchema, {
    limit:
      typeof options?.limit === "number" && Number.isFinite(options.limit)
        ? Math.max(0, Math.trunc(options.limit))
        : 100,
    offset:
      typeof options?.offset === "number" && Number.isFinite(options.offset)
        ? Math.max(0, Math.trunc(options.offset))
        : 0,
  });

const toProjectStatus = (status: GrpcProject["status"]) => {
  switch (status) {
    case 1:
      return "declined";
    case 2:
    case 4:
      return "approved";
    case 3:
      return "pending";
    default:
      return "unknown";
  }
};

const readProjectAuthorId = (project: ApiProject) => {
  const rawId = project.author?.userID ?? project.author?.uid;
  if (typeof rawId === "number" && Number.isFinite(rawId)) {
    return rawId;
  }
  if (typeof rawId === "string") {
    const trimmed = rawId.trim();
    return trimmed || undefined;
  }
  return undefined;
};

const toApiProject = (project: GrpcProject): ApiProject => {
  const createdAt = toGrpcTimestamp(project.at);
  const authorId = project.author.trim();
  const location = project.location
    ? {
        city: project.location.cityId || undefined,
        cityId: project.location.cityId || undefined,
        latitude: project.location.lat,
        longitude: project.location.lot,
        lat: project.location.lat,
        lng: project.location.lot,
      }
    : null;
  const info: ApiProjectInfo = {
    title: project.title,
    description: project.description,
    category: project.category,
    location,
  };
  const likes = toSafeNumber(project.likes);
  return {
    id: project.id,
    author: authorId
      ? { uid: authorId, userID: authorId }
      : null,
    info,
    details: info,
    likesCount: likes,
    likes_count: likes,
    createdAt,
    created_at: createdAt,
    status: toProjectStatus(project.status),
  };
};

const hydrateProjectAuthor = async (
  project: ApiProject,
  signal?: AbortSignal,
): Promise<ApiProject> => {
  const authorId = readProjectAuthorId(project);
  if (!authorId) {
    return project;
  }
  try {
    const author = await fetchUserPublic(authorId, { signal });
    return {
      ...project,
      author: {
        ...author,
        uid: author.uid ?? author.userID ?? authorId,
        userID: author.userID ?? author.uid ?? authorId,
      },
    };
  } catch {
    return project;
  }
};

const hydrateProjectAuthors = async (
  projects: ApiProject[],
  signal?: AbortSignal,
): Promise<ApiProject[]> => {
  const hydrated = await Promise.allSettled(
    projects.map((project) => hydrateProjectAuthor(project, signal)),
  );
  return hydrated.map((result, index) =>
    result.status === "fulfilled" ? result.value : projects[index],
  );
};

const toApiSubmission = (
  submission: GrpcSubmission,
  project?: ApiProject | null,
): ApiSubmissionTarget => ({
  id: submission.id,
  info: project ?? (submission.project ? { id: submission.project } : null),
  state: submission.approved
    ? "approved"
    : submission.reason.trim()
      ? "declined"
      : "pending",
  reason: submission.reason || null,
});

const toTicketStatus = (status: GrpcTicket["status"]) => {
  switch (status) {
    case 1:
      return "closed";
    case 4:
      return "in_progress";
    case 2:
    case 3:
    default:
      return "new";
  }
};

const toApiTicket = (ticket: GrpcTicket): ApiTicket => ({
  id: ticket.id,
  authorId: ticket.authorId,
  author_id: ticket.authorId,
  acceptor: ticket.acceptor,
  assignee: ticket.acceptor ? { id: ticket.acceptor } : undefined,
  status: toTicketStatus(ticket.status),
  topic: ticket.topic,
  title: ticket.title,
  subject: ticket.title || ticket.topic,
  createdAt: toGrpcTimestamp(ticket.created),
  acceptedAt: toGrpcTimestamp(ticket.accepted),
  closedAt: toGrpcTimestamp(ticket.closed),
  caller: ticket.caller,
  closer: ticket.closer,
  reason: ticket.reason,
});

const toApiTicketMessage = (message: GrpcTicketMessage): ApiTicketMessage => ({
  id: message.id,
  ticket: message.ticket,
  authorId: message.author,
  author: message.author ? { id: message.author } : undefined,
  content: message.content,
  message: message.content,
  createdAt: toGrpcTimestamp(message.created),
});

const toApiProjectMessage = (
  message: GrpcProjectMessage,
): ApiTicketMessage => ({
  id: message.id,
  authorId: message.author,
  author: message.author ? { id: message.author } : undefined,
  parentId: message.parent || undefined,
  parent_id: message.parent || undefined,
  content: message.content,
  message: message.content,
  createdAt: toGrpcTimestamp(message.at),
  deletedAt: toGrpcTimestamp(message.deleted),
});

const flattenPermissions = (permissions?: ApiPermissions): string[] => {
  if (!permissions) {
    return [];
  }
  const output = new Set<string>();
  const walk = (value: unknown, path: string[]) => {
    if (typeof value === "boolean") {
      if (value && path.length > 0) {
        output.add(path.join("."));
      }
      return;
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      walk(child, [...path, key]);
    }
  };
  walk(permissions, []);
  return [...output];
};

export type StatisticsGraphPoint = {
  at: string;
  value: number;
};

export type StatisticsGraph = {
  list: StatisticsGraphPoint[];
  separator: Separator;
};

export type StatisticsGlobal = {
  ideas: number;
  implemented: number;
  votes: number;
  city?: string;
  hours: number;
};

const toStatisticsGraph = (graph: GrpcGraph): StatisticsGraph => ({
  separator: graph.separator,
  list: graph.list
    .map((point) => {
      const at = toGrpcTimestamp(point.at);
      return at ? { at, value: point.value } : null;
    })
    .filter((point): point is StatisticsGraphPoint => point !== null),
});

const toStatisticsGlobal = (global: GrpcGlobal): StatisticsGlobal => ({
  ideas: toSafeNumber(global.ideas),
  implemented: toSafeNumber(global.implemented),
  votes: toSafeNumber(global.votes),
  city: global.city || undefined,
  hours:
    typeof global.supportDelay === "number" && Number.isFinite(global.supportDelay)
      ? global.supportDelay
      : 0,
});

const mapGrpcCodeToHttpStatus = (code: Code) => {
  switch (code) {
    case Code.InvalidArgument:
      return StatusCodes.BAD_REQUEST;
    case Code.Unauthenticated:
      return StatusCodes.UNAUTHORIZED;
    case Code.PermissionDenied:
      return StatusCodes.FORBIDDEN;
    case Code.NotFound:
      return StatusCodes.NOT_FOUND;
    case Code.AlreadyExists:
      return StatusCodes.CONFLICT;
    case Code.ResourceExhausted:
      return StatusCodes.TOO_MANY_REQUESTS;
    case Code.Unavailable:
      return StatusCodes.SERVICE_UNAVAILABLE;
    case Code.Unimplemented:
      return StatusCodes.NOT_IMPLEMENTED;
    default:
      return StatusCodes.INTERNAL_SERVER_ERROR;
  }
};

async function grpcRequest<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (!(error instanceof ConnectError)) {
      throw error;
    }
    const status = mapGrpcCodeToHttpStatus(error.code);
    const publicMessage = getPublicApiErrorMessage(status, error.message);
    if (isMfaRequiredResponse(status, null, error.message)) {
      emitMfaRequired({ reason: publicMessage });
      throw new MfaRequiredError(publicMessage);
    }
    throw new ApiError(status, publicMessage);
  }
}

const normalizeAuthChallengeType = (
  value?: string,
  destination?: string,
): AuthChallengeType => {
  const normalized = value?.trim().toLowerCase();
  if (normalized) {
    if (
      normalized.includes("totp") ||
      normalized.includes("auth") ||
      normalized.includes("app")
    ) {
      return "totp";
    }
    if (normalized.includes("mail") || normalized.includes("email")) {
      return "email";
    }
  }
  if (destination && destination.includes("@")) {
    return "email";
  }
  return "unknown";
};

const parseAuthChallenge = (
  record: Record<string, unknown> | null,
): AuthChallenge | null => {
  if (!record) {
    return null;
  }

  const required =
    pickBoolean(record, [
      "required",
      "require",
      "codeRequired",
      "code_required",
      "otpRequired",
      "otp_required",
      "twoFactorRequired",
      "two_factor_required",
      "mfaRequired",
      "mfa_required",
    ]) ?? false;
  const typeValue = pickString(record, [
    "type",
    "method",
    "channel",
    "delivery",
    "codeType",
    "code_type",
    "otpType",
    "otp_type",
    "mfaType",
    "mfa_type",
  ]);
  const token = pickString(record, [
    "token",
    "challenge",
    "challengeId",
    "challenge_id",
    "session",
    "sessionId",
    "session_id",
  ]);
  const verifyUrl = pickString(record, [
    "verifyUrl",
    "verify_url",
    "verificationUrl",
    "verification_url",
    "confirmUrl",
    "confirm_url",
    "checkUrl",
    "check_url",
  ]);
  const resendUrl = pickString(record, ["resendUrl", "resend_url", "resend"]);
  const destination = pickString(record, [
    "destination",
    "email",
    "maskedEmail",
    "masked_email",
    "address",
    "mail",
  ]);
  const expiresAt = pickString(record, [
    "expiresAt",
    "expires_at",
    "expires",
    "validUntil",
    "valid_until",
  ]);
  const length = pickNumber(record, [
    "length",
    "codeLength",
    "code_length",
    "digits",
  ]);

  if (!required && !typeValue && !token && !verifyUrl && !resendUrl) {
    return null;
  }

  return {
    type: normalizeAuthChallengeType(typeValue, destination),
    token,
    verifyUrl,
    resendUrl,
    destination,
    expiresAt,
    length,
  };
};

const extractAuthChallenge = (payload: unknown): AuthChallenge | null => {
  const root = toRecord(payload);
  if (!root) {
    return null;
  }
  const data = toRecord(root.data);
  const candidates = [
    toRecord(root.challenge),
    toRecord(root.twoFactor),
    toRecord(root.two_factor),
    toRecord(data?.challenge),
    toRecord(data?.twoFactor),
    toRecord(data?.two_factor),
    data,
    root,
  ];
  for (const candidate of candidates) {
    const parsed = parseAuthChallenge(candidate);
    if (parsed) {
      return parsed;
    }
  }

  const dataString =
    pickString(root, ["data", "status", "result"]) ??
    pickString(data, ["data", "status", "result"]);
  if (dataString) {
    const normalized = dataString.toLowerCase();
    if (normalized.includes("otp") || normalized.includes("code")) {
      return { type: normalizeAuthChallengeType(normalized, undefined) };
    }
  }
  return null;
};

const normalizeAuthResult = (payload: unknown): AuthResult => {
  const root = toRecord(payload);
  const data = root ? toRecord(root.data) : null;
  const redirectUrl =
    pickString(root, [
      "redirectUrl",
      "redirect_url",
      "returnUrl",
      "return_url",
      "nextUrl",
      "next_url",
      "next",
    ]) ??
    pickString(data, [
      "redirectUrl",
      "redirect_url",
      "returnUrl",
      "return_url",
      "nextUrl",
      "next_url",
      "next",
    ]);
  const challenge = extractAuthChallenge(payload);
  if (challenge) {
    return {
      status: "challenge",
      challenge: {
        ...challenge,
        redirectUrl: challenge.redirectUrl ?? redirectUrl,
      },
      redirectUrl,
    };
  }
  return { status: "ok", redirectUrl };
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let rawMessage = `Request failed (${response.status})`;
    let data: { error?: string; data?: unknown; message?: string } | null =
      null;
    const rawText = await response.text();
    if (rawText) {
      try {
        data = JSON.parse(rawText) as {
          error?: string;
          data?: unknown;
          message?: string;
        };
      } catch {
        rawMessage = rawText;
      }
    } else if (response.statusText) {
      rawMessage = response.statusText;
    }

    if (data?.error) {
      rawMessage = data.error;
    } else if (data?.message) {
      rawMessage = data.message;
    }

    if (isBannedResponse(response.status, data, rawMessage)) {
      await handleBannedUser({ signal: init?.signal });
    }

    const publicMessage = getPublicApiErrorMessage(response.status, rawMessage);
    if (isMfaRequiredResponse(response.status, data, rawMessage)) {
      emitMfaRequired({ reason: publicMessage });
      throw new MfaRequiredError(publicMessage);
    }
    throw new ApiError(response.status, publicMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function handleBannedUser(options?: {
  signal?: AbortSignal | null;
}) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const response = await fetch(buildApiUrl("/api/user/ban/info"), {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
      signal: options?.signal,
    });
    if (response.ok) {
      const payload = (await response.json()) as ApiBanInfoResponse;
      const banInfo: BanInfo = {
        id: payload?.id,
        reason: payload?.reason,
        at: payload?.at,
        expires: payload?.expires ?? null,
      };
      window.sessionStorage.setItem(BAN_STORAGE_KEY, JSON.stringify(banInfo));
    } else {
      window.sessionStorage.removeItem(BAN_STORAGE_KEY);
    }
  } catch {
    window.sessionStorage.removeItem(BAN_STORAGE_KEY);
  }

  if (window.location.pathname !== "/banned") {
    window.location.assign("/banned");
  }
}

export async function registerUser(payload: RegisterPayload): Promise<void> {
  await grpcRequest(() =>
    loginClient.register(
      create(RegisterRequestSchema, {
        username: payload.username.trim(),
        email: payload.email.trim(),
        password: payload.password,
      }),
    ),
  );
}

export async function authorizeUser(
  payload: AuthorizationPayload,
): Promise<AuthResult> {
  await grpcRequest(() =>
    loginClient.authorize(
      create(AuthorizeRequestSchema, {
        userMail: payload.usermail.trim(),
        password: payload.password,
      }),
    ),
  );
  return { status: "ok" };
}

export async function requestPasswordReset(
  payload: PasswordResetRequest,
): Promise<void> {
  const email = payload.email.trim();
  if (!email) {
    throw new Error("Email is required.");
  }
  await apiRequest("/api/login/reset-password/start", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  payload: PasswordResetPayload,
): Promise<void> {
  const email = payload.email.trim();
  const password = payload.password.trim();
  const token = payload.token.trim();
  if (!email || !password || !token) {
    throw new Error("Email, password, and token are required.");
  }
  await apiRequest("/api/login/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, password, token }),
  });
}

export async function requestEmailVerification(payload: {
  email: string;
}): Promise<void> {
  const email = payload.email.trim();
  if (!email) {
    throw new Error("Email is required.");
  }
  await grpcRequest(() => loginClient.sendVerifyEmail(create(EmptySchema, {})));
}

export async function verifyEmail(payload: { token: string }): Promise<void> {
  const token = payload.token.trim();
  if (!token) {
    throw new Error("Token is required.");
  }
  await grpcRequest(() =>
    loginClient.verifyEmail(create(RequestWithValueSchema, { value: token })),
  );
}

export async function verifyAuthCode(payload: {
  code: string;
  challenge?: AuthChallenge | null;
}): Promise<AuthResult> {
  const code = payload.code.trim();
  if (!code) {
    throw new Error("Code is required.");
  }
  const endpoint =
    payload.challenge?.verifyUrl?.trim() || "/api/login/authorization/verify";
  const body: Record<string, unknown> = { code };
  if (payload.challenge?.token) {
    body.token = payload.challenge.token;
  }
  if (payload.challenge?.type && payload.challenge.type !== "unknown") {
    body.type = payload.challenge.type;
  }
  if (
    payload.challenge?.destination &&
    !payload.challenge.destination.includes("*")
  ) {
    body.destination = payload.challenge.destination;
  }
  if (payload.challenge?.loginMethod) {
    body.method = payload.challenge.loginMethod;
  }
  const response = await apiRequest<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeAuthResult(response);
}

export async function resendAuthCode(challenge: AuthChallenge): Promise<void> {
  const endpoint =
    challenge.resendUrl?.trim() || "/api/login/authorization/resend";
  const body: Record<string, unknown> = {};
  if (challenge.token) {
    body.token = challenge.token;
  }
  if (challenge.type && challenge.type !== "unknown") {
    body.type = challenge.type;
  }
  if (challenge.destination && !challenge.destination.includes("*")) {
    body.destination = challenge.destination;
  }
  await apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function checkMfaCode(payload: { code: string }): Promise<void> {
  const code = payload.code.trim();
  if (!code) {
    throw new Error("Code is required.");
  }
  await grpcRequest(() =>
    loginClient.checkTotp(create(RequestWithValueSchema, { value: code })),
  );
}

const parseOtpauthUrl = (
  url: string,
): { secret?: string; digits?: number; period?: number } => {
  if (!url || !url.toLowerCase().startsWith("otpauth://")) {
    return {};
  }
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;
    const secret = params.get("secret") ?? undefined;
    const digitsRaw = params.get("digits");
    const periodRaw = params.get("period");
    const digits = digitsRaw ? Number.parseInt(digitsRaw, 10) : undefined;
    const period = periodRaw ? Number.parseInt(periodRaw, 10) : undefined;
    return {
      secret,
      digits: Number.isFinite(digits) ? digits : undefined,
      period: Number.isFinite(period) ? period : undefined,
    };
  } catch {
    return {};
  }
};

export async function startTotpEnrollment(): Promise<TotpEnrollment> {
  const response = await grpcRequest(() =>
    loginClient.createTotp(create(EmptySchema, {})),
  );
  const otpauthUrl = response.url || undefined;
  const parsed = otpauthUrl ? parseOtpauthUrl(otpauthUrl) : {};
  return {
    secret: parsed.secret,
    otpauthUrl,
    qrBase64: response.qr || undefined,
    manualUrl: otpauthUrl,
    digits: parsed.digits,
    period: parsed.period,
  };
}

export async function confirmTotpEnrollment(payload: {
  code: string;
  token?: string;
}): Promise<TotpConfirmResult> {
  const code = payload.code.trim();
  if (!code) {
    throw new Error("Code is required.");
  }
  const response = await grpcRequest(() =>
    loginClient.confirmTotp(create(RequestWithValueSchema, { value: code })),
  );
  return {
    recoveryCodes: response.codes
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

export async function disableTotp(payload?: { code?: string }): Promise<void> {
  const code = payload?.code?.trim() ?? "";
  await grpcRequest(() =>
    loginClient.resetTotp(
      create(ResetTotpRequestSchema, {
        kind: Reset.RECOVERY,
        code,
      }),
    ),
  );
}

// ── OAuth helpers ────────────────────────────────────────────────────────────

/** Extract the OAuth state token from the redirect URL returned by the backend. */
const extractOAuthState = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    // VK: ?state=<token>
    const direct = parsed.searchParams.get("state");
    if (direct) return direct;
    // Telegram: ?return_to=<url-with-?state=token>
    const returnTo = parsed.searchParams.get("return_to");
    if (returnTo) {
      const rtUrl = new URL(returnTo);
      const rtState = rtUrl.searchParams.get("state");
      if (rtState) return rtState;
    }
  } catch { /* ignore */ }
  return null;
};

/** Persist the OAuth state in a short-lived cookie so gRPC handlers can read it. */
export const setOAuthStateCookie = (state: string): void => {
  if (typeof document === "undefined") return;
  document.cookie = `oauth_state=${encodeURIComponent(state)}; path=/; SameSite=Lax; max-age=600`;
};

/** Map the gRPC VkCallbackResponse to the generic AuthResult used by callback pages. */
const toOAuthAuthResult = (response: GrpcOAuthCallbackResponse): AuthResult => {
  if (response.type === CallbackType.AUTH) {
    return { status: "ok", redirectUrl: "/" };
  }
  if (response.type === CallbackType.REGISTER) {
    // Store pre-filled info so the registration form can pick it up.
    try {
      const info = response.register;
      sessionStorage.setItem(
        "oauth_register",
        JSON.stringify({
          username: info?.username ?? "",
          email: info?.email ?? "",
          displayName: info?.displayName ?? "",
          avatarUrl: info?.avatarUrl ?? "",
        }),
      );
    } catch { /* ignore */ }
    return { status: "ok", redirectUrl: "/auth?oauth=register" };
  }
  if (response.type === CallbackType.LINK) {
    return { status: "ok", redirectUrl: "/" };
  }
  throw new Error("Unexpected OAuth response type.");
};

// ── VK OAuth ─────────────────────────────────────────────────────────────────

export async function startVkAuth(mode: "login" | "register" = "login"): Promise<{
  authUrl: string;
  state?: string;
}> {
  const payload = await grpcRequest(() =>
    loginClient.vkStart(
      create(VkStartRequestSchema, {
        type: mode === "register" ? CallbackType.REGISTER : CallbackType.AUTH,
      }),
    ),
  );
  const authUrl = payload.value.trim();
  if (!authUrl) throw new Error("VK auth URL is missing.");
  const state = extractOAuthState(authUrl) ?? undefined;
  if (state) setOAuthStateCookie(state);
  return { authUrl, state };
}

export async function completeVkAuth(
  code: string,
  state: string,
  _device_id?: string,
): Promise<AuthResult> {
  const response = await grpcRequest(() =>
    loginClient.vkCallback(
      create(VkCallbackRequestSchema, { code, state }),
    ),
  );
  return toOAuthAuthResult(response);
}

// ── Telegram OAuth ────────────────────────────────────────────────────────────

export async function startTgAuth(mode: "login" | "register" = "login"): Promise<{
  authUrl: string;
  state?: string;
}> {
  const payload = await grpcRequest(() =>
    loginClient.tgStart(
      create(TgStartRequestSchema, {
        type: mode === "register" ? CallbackType.REGISTER : CallbackType.AUTH,
      }),
    ),
  );
  const authUrl = payload.value.trim();
  if (!authUrl) throw new Error("Telegram auth URL is missing.");
  const state = extractOAuthState(authUrl) ?? undefined;
  if (state) setOAuthStateCookie(state);
  return { authUrl, state };
}

export async function completeTgAuth(tgAuthResult: string): Promise<AuthResult> {
  const response = await grpcRequest(() =>
    loginClient.tgCallback(
      create(TgCallbackRequestSchema, { tgAuthResult }),
    ),
  );
  return toOAuthAuthResult(response);
}

function toUserListItem(payload: ApiUserPublic): UserListItem | null {
  const rawUserID = payload.userID ?? payload.uid;
  const userID =
    typeof rawUserID === "number"
      ? rawUserID
      : typeof rawUserID === "string" && rawUserID.trim()
        ? rawUserID.trim()
        : null;
  const username = payload.username;
  if (userID === null || !username) {
    return null;
  }

  const settings = payload.settings ?? undefined;
  const displayName =
    settings?.display_name ?? settings?.displayName ?? undefined;
  const avatar = toAvatar(settings?.avatar) ?? null;
  const joined = payload.joined ?? payload.joinedAt;
  const banned = payload.banned ?? false;

  return {
    userID,
    username,
    displayName,
    avatar,
    banned,
    rank: payload.rank ?? undefined,
    joined,
  };
}

function toApiUserPublic(payload: GrpcPublicUser): ApiUserPublic {
  return {
    uid: payload.id,
    userID: payload.id,
    username: payload.username || undefined,
    settings: payload.prefs
      ? {
        displayName: payload.prefs.displayName || undefined,
        display_name: payload.prefs.displayName || undefined,
        description: payload.prefs.description || undefined,
        avatar: payload.prefs.avatar ? { key: payload.prefs.avatar } : null,
      }
      : null,
    rank: payload.rank?.name ? { name: payload.rank.name } : null,
    joined: toGrpcTimestamp(payload.joined),
  };
}

export async function logoutUser(): Promise<void> {
  await grpcRequest(() => loginClient.logout(create(EmptySchema, {})));
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const payload = await grpcRequest(() =>
    userClient.self(create(EmptySchema, {})),
  );
  const publicUser = payload.public;
  if (!publicUser?.id || !publicUser.username) {
    throw new Error("Missing user payload.");
  }
  return {
    uid: publicUser.id,
    username: publicUser.username,
    email: payload.security?.email || undefined,
    emailVerified: payload.security?.emailVerified || false,
    displayName: publicUser.prefs?.displayName || undefined,
    description: publicUser.prefs?.description || undefined,
    avatar: publicUser.prefs?.avatar ? { key: publicUser.prefs.avatar } : null,
    rank: publicUser.rank?.name
      ? {
        name: publicUser.rank.name,
      }
      : null,
    totpEnabled: payload.security?.totpEnabled || false,
    joined: toGrpcTimestamp(publicUser.joined),
  };
}

const normalizeUserID = (userID: UserID): string => {
  if (typeof userID === "number") {
    if (!Number.isFinite(userID) || userID <= 0) {
      throw new Error("User id is required.");
    }
    return String(userID);
  }
  const trimmed = userID.trim();
  if (!trimmed) {
    throw new Error("User id is required.");
  }
  return trimmed;
};

export async function fetchUserSessions(options?: {
  signal?: AbortSignal;
}): Promise<UserSession[]> {
  const payload = await grpcRequest(() =>
    sessionClient.list(
      create(RequestWithLimitAndOffsetSchema, {
        limit: 100,
        offset: 0,
      }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map((session) => ({
    id: session.id,
    createdAt: toGrpcTimestamp(session.at),
    lastSeenAt: toGrpcTimestamp(session.seen),
    hash: session.hash || undefined,
  }));
}

export async function revokeUserSession(id: string): Promise<void> {
  const trimmedId = id.trim();
  if (!trimmedId) {
    throw new Error("Session id is required.");
  }
  await grpcRequest(() =>
    sessionClient.revoke(create(RequestWithValueSchema, { value: trimmedId })),
  );
}

export async function fetchUserPublic(
  userID: UserID,
  options?: { signal?: AbortSignal },
): Promise<ApiUserPublic> {
  const normalizedUserID = normalizeUserID(userID);
  try {
    const grpcPayload = await grpcRequest(() =>
      userClient.info(create(RequestWithValueSchema, { value: normalizedUserID }), {
        signal: options?.signal,
      }),
    );
    if (grpcPayload.id || grpcPayload.username) {
      return toApiUserPublic(grpcPayload);
    }
  } catch {
    // Fall back to the legacy REST endpoint below.
  }

  const payload = await apiRequest<ApiUserPublic | ApiUserPublicResponse>(
    `/api/user/${encodeURIComponent(normalizedUserID)}`,
    {
      method: "GET",
      signal: options?.signal,
    },
  );
  const data = isApiUserPublicResponse(payload) ? payload.data : payload;
  if (!data) {
    throw new Error("Missing user payload.");
  }
  return data;
}

export async function fetchUserPermissions(
  _userID: UserID,
  rankName?: string,
  options?: { signal?: AbortSignal },
): Promise<ApiPermissions | null> {
  if (!rankName) {
    return null;
  }
  return fetchRankPermissions(rankName, options);
}

export async function updateUserPermission(
  _userID: UserID,
  permission: string,
  state: boolean,
  rankName?: string,
): Promise<void> {
  const trimmed = permission.trim();
  if (!trimmed) {
    throw new Error("Permission is required.");
  }
  if (!rankName) {
    throw new Error("Rank name is required to update permissions.");
  }
  await updateRankPermission(rankName, trimmed, state);
}

export async function setUserRank(
  userID: UserID,
  rank: string,
  expiresAt?: Date | string | null,
): Promise<void> {
  const normalizedUserID = normalizeUserID(userID);
  const trimmedRank = rank.trim();
  if (!trimmedRank) {
    throw new Error("Rank is required.");
  }
  await grpcRequest(() =>
    rankClient.assign(
      create(AssignRankRequestSchema, {
        userId: String(normalizedUserID),
        rankName: trimmedRank,
        cityId: "",
      }),
    ),
  );
}

export async function fetchRanksList(options?: {
  signal?: AbortSignal;
}): Promise<ApiRankListItem[]> {
  const payload = await grpcRequest(() =>
    rankClient.list(
      create(RequestWithLimitAndOffsetSchema, {
        limit: 100,
        offset: 0,
      }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map((rank) => ({
    name: rank.name,
    description: rank.description || undefined,
    color:
      typeof rank.color === "bigint" ? Number(rank.color) : Number(rank.color),
    added: toGrpcTimestamp(rank.at),
    weight: rank.weight,
  }));
}

type RankCreatePayload = {
  name: string;
  description: string;
  color: number;
  permissions?: ApiPermissions;
};

export async function createRank(payload: RankCreatePayload): Promise<void> {
  const name = payload.name.trim();
  const description = payload.description.trim();
  if (!name) {
    throw new Error("Rank name is required.");
  }
  if (!description) {
    throw new Error("Rank description is required.");
  }
  if (!Number.isFinite(payload.color) || payload.color <= 0) {
    throw new Error("Rank color is required.");
  }
  await grpcRequest(() =>
    rankClient.create(
      create(RankCreateRequestSchema, {
        name,
        description,
        color: BigInt(Math.floor(payload.color)),
        weight: 0,
        perms: flattenPermissions(payload.permissions),
      }),
    ),
  );
}

const fetchRankByName = async (name: string, signal?: AbortSignal) => {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Rank name is required.");
  }
  return grpcRequest(() =>
    rankClient.rank(create(RequestWithValueSchema, { value: trimmed }), {
      signal,
    }),
  );
};

export async function updateRank(
  name: string,
  target: "name" | "description" | "color",
  value: string | number,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Rank name is required.");
  }
  const current = await fetchRankByName(trimmed);
  await grpcRequest(() =>
    rankClient.edit(
      create(RankSchema, {
        id: current.id,
        name: target === "name" ? String(value).trim() : current.name,
        description:
          target === "description" ? String(value).trim() : current.description,
        color:
          target === "color"
            ? BigInt(Math.floor(Number(value)))
            : current.color,
        weight: current.weight,
        permissions: current.permissions,
      }),
    ),
  );
}

export async function deleteRank(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Rank name is required.");
  }
  const current = await fetchRankByName(trimmed);
  await grpcRequest(() =>
    rankClient.delete(create(RequestWithValueSchema, { value: current.id })),
  );
}

export async function fetchRankPermissions(
  name: string,
  options?: { signal?: AbortSignal },
): Promise<ApiPermissions | null> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Rank name is required.");
  }
  const payload = await fetchRankByName(trimmed, options?.signal);
  return payload.permissions.reduce<ApiPermissions>((acc, permission) => {
    acc[permission] = true;
    return acc;
  }, {});
}

export async function fetchRankPermissionNames(
  options?: { signal?: AbortSignal },
): Promise<string[]> {
  const payload = await grpcRequest(() =>
    rankClient.permissions(create(EmptySchema, {}), {
      signal: options?.signal,
    }),
  );
  return payload.perms;
}

export async function updateRankPermission(
  name: string,
  permission: string,
  state: boolean,
): Promise<void> {
  const trimmedName = name.trim();
  const trimmedPerm = permission.trim();
  if (!trimmedName) {
    throw new Error("Rank name is required.");
  }
  if (!trimmedPerm) {
    throw new Error("Permission is required.");
  }
  const current = await fetchRankByName(trimmedName);
  const permissions = new Set(current.permissions);
  if (state) {
    permissions.add(trimmedPerm);
  } else {
    permissions.delete(trimmedPerm);
  }
  await grpcRequest(() =>
    rankClient.edit(
      create(RankSchema, {
        id: current.id,
        name: current.name,
        description: current.description,
        color: current.color,
        weight: current.weight,
        permissions: [...permissions],
      }),
    ),
  );
}

export async function fetchRankUsers(
  name: string,
  options?: { signal?: AbortSignal },
): Promise<UserListItem[]> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Rank name is required.");
  }
  const payload = await grpcRequest(() =>
    userClient.list(
      create(RequestWithLimitAndOffsetSchema, { limit: 500, offset: 0 }),
      { signal: options?.signal },
    ),
  );
  const normalizedName = trimmed.toLowerCase();
  return payload.list
    .filter((u) => u.rank?.name?.toLowerCase() === normalizedName)
    .map((u) => ({
      userID: u.id,
      username: u.username,
      displayName: u.prefs?.displayName || undefined,
      avatar: u.prefs?.avatar ? { key: u.prefs.avatar } : null,
      banned: false,
      rank: u.rank?.name ? { name: u.rank.name } : null,
      joined: toGrpcTimestamp(u.joined),
    }));
}

export async function fetchUsers(options?: {
  signal?: AbortSignal;
}): Promise<UserListItem[]> {
  const payload = await grpcRequest(() =>
    userClient.list(
      create(RequestWithLimitAndOffsetSchema, {
        limit: 500,
        offset: 0,
      }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map((user) => ({
    userID: user.id,
    username: user.username,
    displayName: user.prefs?.displayName || undefined,
    avatar: user.prefs?.avatar ? { key: user.prefs.avatar } : null,
    banned: false,
    rank: user.rank?.name
      ? {
        name: user.rank.name,
      }
      : null,
    joined: toGrpcTimestamp(user.joined),
  }));
}

export async function fetchUserBanInfo(
  userID: UserID,
  banned?: boolean,
  options?: { signal?: AbortSignal },
): Promise<BanInfo | null> {
  if (banned === false) {
    return null;
  }

  try {
    const normalizedUserID = normalizeUserID(userID);
    const payload = await apiRequest<ApiBanInfoResponse>(
      `/api/user/${encodeURIComponent(String(normalizedUserID))}/ban`,
      { method: "GET", signal: options?.signal },
    );
    if (!payload) {
      return null;
    }
    return {
      id: typeof payload.id === "string" ? payload.id : undefined,
      reason: typeof payload.reason === "string" ? payload.reason : undefined,
      at: typeof payload.at === "string" ? payload.at : undefined,
      expires: typeof payload.expires === "string" ? payload.expires : null,
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return null;
    }
    if (error instanceof ConnectError) {
      return null;
    }
    return null;
  }
}

export async function banUser(
  userID: UserID,
  reason: string,
  durationSeconds = 0,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("Ban reason is required.");
  }
  const normalizedUserID = normalizeUserID(userID);
  const until =
    durationSeconds > 0
      ? timestampFromDate(new Date(Date.now() + Math.floor(durationSeconds) * 1000))
      : undefined;
  await grpcRequest(() =>
    userClient.ban(
      create(BanRequestSchema, {
        target: String(normalizedUserID),
        reason: trimmed,
        until,
      }),
    ),
  );
}

export async function unbanUser(userID: UserID): Promise<void> {
  const normalizedUserID = normalizeUserID(userID);
  await grpcRequest(() =>
    userClient.unban(
      create(RequestWithValueSchema, { value: String(normalizedUserID) }),
    ),
  );
}

export async function updateDisplayName(name: string): Promise<AuthUser> {
  await grpcRequest(() =>
    userClient.updatePreferences(
      create(UpdatePreferencesRequestSchema, {
        displayName: name.trim(),
      }),
    ),
  );
  return fetchCurrentUser();
}

export async function updateProfileDescription(
  description: string,
): Promise<AuthUser> {
  await grpcRequest(() =>
    userClient.updatePreferences(
      create(UpdatePreferencesRequestSchema, {
        description: description.trim(),
      }),
    ),
  );
  return fetchCurrentUser();
}

export async function updateAvatar(
  payload: AvatarUploadPayload,
): Promise<AuthUser> {
  if (!payload?.file) {
    throw new Error("Avatar file is required.");
  }
  const userId =
    typeof payload.userId === "number"
      ? payload.userId
      : payload.userId.trim();
  if (
    (typeof userId === "number" && (!Number.isFinite(userId) || userId <= 0)) ||
    (typeof userId === "string" && !userId)
  ) {
    throw new Error("User id is required.");
  }
  const contentType =
    payload.contentType?.trim() ||
    payload.file.type ||
    "application/octet-stream";
  const key = payload.key?.trim() || `avatars/${userId}/current`;
  const presignResponse = await apiRequest<PresignResponse>(
    `/api/storage/presign/put?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`,
    {
      method: "GET",
    },
  );
  const presignUrl = presignResponse?.presign?.trim();
  if (!presignUrl) {
    throw new Error("Avatar upload URL is missing.");
  }
  const uploadResponse = await fetch(presignUrl, {
    method: "PUT",
    body: payload.file,
    credentials: "omit",
    headers: contentType ? { "Content-Type": contentType } : undefined,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Avatar upload failed (${uploadResponse.status}).`);
  }
  await apiRequest("/api/user/avatar", {
    method: "POST",
    body: JSON.stringify({ key, contentType }),
  });
  return fetchCurrentUser();
}

export async function deleteAvatar(): Promise<AuthUser> {
  await apiRequest("/api/user/delete/avatar", {
    method: "DELETE",
  });
  return fetchCurrentUser();
}

export async function deleteUserAvatar(userID: UserID): Promise<void> {
  const normalizedUserID = normalizeUserID(userID);
  await apiRequest(`/api/user/${encodeURIComponent(normalizedUserID)}/delete/avatar`, {
    method: "DELETE",
  });
}

export async function deleteProfile(): Promise<void> {
  await apiRequest("/api/user/delete/profile", {
    method: "POST",
  });
}

export async function deleteUserDescription(userID: UserID): Promise<void> {
  const normalizedUserID = normalizeUserID(userID);
  await apiRequest(`/api/user/${encodeURIComponent(normalizedUserID)}/delete/description`, {
    method: "POST",
  });
}

export async function deleteUserProfile(userID: UserID): Promise<void> {
  const normalizedUserID = normalizeUserID(userID);
  await apiRequest(`/api/user/${encodeURIComponent(normalizedUserID)}/delete/profile`, {
    method: "POST",
  });
}

export async function fetchProjects(options?: {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<ApiProject[]> {
  const payload = await grpcRequest(() =>
    projectsClient.projectsList(toLimitOffsetRequest(options), {
      signal: options?.signal,
    }),
  );
  return hydrateProjectAuthors(payload.list.map(toApiProject), options?.signal);
}

export async function fetchProjectById(
  projectID: string,
  options?: { signal?: AbortSignal },
): Promise<ApiProject | null> {
  const trimmedId = projectID.trim();
  if (!trimmedId) {
    throw new Error("Project id is required.");
  }
  const payload = await grpcRequest(() =>
    projectsClient.project(create(RequestWithValueSchema, { value: trimmedId }), {
      signal: options?.signal,
    }),
  );
  return hydrateProjectAuthor(toApiProject(payload), options?.signal);
}

export async function fetchTopProjects(options?: {
  limit?: number;
  city?: string;
  signal?: AbortSignal;
}): Promise<ApiProject[]> {
  const payload = await grpcRequest(() =>
    projectsClient.projectsTop(
      create(RequestWithLimitAndOffsetAndValueSchema, {
        limit:
          typeof options?.limit === "number" && Number.isFinite(options.limit)
            ? Math.max(0, Math.trunc(options.limit))
            : 10,
        offset: 0,
        value: options?.city?.trim() || "",
      }),
      {
        signal: options?.signal,
      },
    ),
  );
  return hydrateProjectAuthors(payload.list.map(toApiProject), options?.signal);
}

export async function fetchArchivedProjects(options?: {
  limit?: number;
  offset?: number;
  signal?: AbortSignal;
}): Promise<ApiProject[]> {
  const projects = await fetchProjects(options);
  return projects.filter((project) => project.status === "declined");
}

export type CreateProjectPayload = {
  title: string;
  description?: string;
  photos?: ApiAvatar[];
  category: string;
  location: ApiProjectLocation;
};

export async function createProject(
  payload: CreateProjectPayload,
): Promise<{ id?: string; tracing?: string }> {
  const response = await grpcRequest(() =>
    projectsClient.createProject(
      create(CreateProjectRequestSchema, {
        title: payload.title.trim(),
        description: payload.description?.trim() || "",
        category: payload.category.trim(),
        location: create(ProjectLocationSchema, {
          cityId: payload.location.city?.trim() || "",
          lat: payload.location.latitude ?? payload.location.lat ?? 0,
          lot: payload.location.longitude ?? payload.location.lng ?? 0,
        }),
      }),
    ),
  );
  return { id: response.id || undefined };
}

export async function changeProjectTitle(
  projectID: string,
  title: string,
): Promise<void> {
  const encodedId = encodeURIComponent(projectID);
  const encodedTitle = encodeURIComponent(title);
  await apiRequest(`/api/projects/${encodedId}/name/${encodedTitle}`, {
    method: "PATCH",
  });
}

export async function changeProjectDescription(
  projectID: string,
  description: string,
): Promise<void> {
  const encodedId = encodeURIComponent(projectID);
  const encodedDescription = encodeURIComponent(description);
  await apiRequest(
    `/api/project/${encodedId}/description/${encodedDescription}`,
    {
      method: "PATCH",
    },
  );
}

export async function deleteProject(projectID: string): Promise<void> {
  const trimmedId = projectID.trim();
  if (!trimmedId) {
    throw new Error("Project id is required.");
  }
  await grpcRequest(() =>
    projectsClient.deleteProject(
      create(RequestWithValueSchema, { value: trimmedId }),
    ),
  );
}

export async function fetchProjectCategories(options?: {
  signal?: AbortSignal;
}): Promise<string[]> {
  const payload = await apiRequest<ApiProjectCategoriesResponse>(
    "/api/projects/categories",
    {
      method: "GET",
      signal: options?.signal,
    },
  );
  const categories = payload?.categories ?? [];
  return Array.isArray(categories) ? categories : [];
}

export async function fetchSubmissions(options?: {
  signal?: AbortSignal;
}): Promise<ApiSubmissionTarget[]> {
  const payload = await grpcRequest(() =>
    projectsClient.submissionsList(
      create(RequestWithLimitAndOffsetSchema, {
        limit: 200,
        offset: 0,
      }),
      {
        signal: options?.signal,
      },
    ),
  );
  const hydrated = await Promise.allSettled(
    payload.list.map(async (submission) => {
      const project = submission.project
        ? await fetchProjectById(submission.project, {
          signal: options?.signal,
        })
        : null;
      return toApiSubmission(submission, project);
    }),
  );
  return hydrated.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : toApiSubmission(payload.list[index]),
  );
}

export async function fetchSubmissionById(
  id: string | number,
  options?: { signal?: AbortSignal },
): Promise<ApiSubmissionTarget | null> {
  const trimmed = String(id).trim();
  if (!trimmed) {
    throw new Error("Submission id is required.");
  }
  const payload = await grpcRequest(() =>
    projectsClient.submission(
      create(RequestWithValueSchema, { value: trimmed }),
      {
        signal: options?.signal,
      },
    ),
  );
  const project = payload.project
    ? await fetchProjectById(payload.project, { signal: options?.signal })
    : null;
  return toApiSubmission(payload, project);
}

export async function fetchMaintenanceActive(options?: {
  signal?: AbortSignal;
}): Promise<boolean> {
  const payload = await apiRequest<unknown>("/api/maintenance/active", {
    method: "GET",
    signal: options?.signal,
  });
  return readMaintenanceFlag(payload);
}

export async function fetchMaintenancePlanned(options?: {
  signal?: AbortSignal;
}): Promise<boolean> {
  try {
    const payload = await grpcRequest(() =>
      maintenanceClient.isPlanned(create(EmptySchema, {}), {
        signal: options?.signal,
      }),
    );
    return Boolean(payload.at || payload.description.trim());
  } catch (error) {
    if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
      return false;
    }
    throw error;
  }
}

export async function fetchMaintenanceData(options?: {
  signal?: AbortSignal;
}): Promise<ApiMaintenanceData | null> {
  try {
    const payload = await grpcRequest(() =>
      maintenanceClient.isPlanned(create(EmptySchema, {}), {
        signal: options?.signal,
      }),
    );
    const willEnd = toGrpcTimestamp(payload.at);
    if (!payload.description.trim() && !willEnd) {
      return null;
    }
    return {
      description: payload.description || undefined,
      willEnd,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === StatusCodes.NOT_FOUND) {
      return null;
    }
    throw error;
  }
}

export type StartMaintenancePayload = {
  description: string;
  willEnd: string;
  scope?: MaintenanceScope | null;
};

export async function startMaintenance(
  payload: StartMaintenancePayload,
): Promise<void> {
  const description = payload.description.trim();
  if (!description) {
    throw new Error("Maintenance description is required.");
  }
  const willEnd = toIsoInputDateTime(payload.willEnd, "Maintenance end date");
  const created = await grpcRequest(() =>
    maintenanceClient.create(
      create(MaintenanceCreateRequestSchema, {
        description,
        time: create(TimeRangeSchema, {
          start: timestampFromDate(new Date()),
          end: timestampFromDate(new Date(willEnd)),
        }),
      }),
    ),
  );
  if (created.id) {
    await grpcRequest(() =>
      maintenanceClient.start(
        create(RequestWithValueSchema, { value: created.id }),
      ),
    );
  }
}

export type ScheduleMaintenancePayload = {
  description: string;
  willStart: string;
  willEnd: string;
  scope?: MaintenanceScope | null;
};

export async function scheduleMaintenance(
  payload: ScheduleMaintenancePayload,
): Promise<void> {
  const description = payload.description.trim();
  if (!description) {
    throw new Error("Maintenance description is required.");
  }
  const willStart = toIsoInputDateTime(
    payload.willStart,
    "Maintenance start date",
  );
  const willEnd = toIsoInputDateTime(payload.willEnd, "Maintenance end date");
  if (new Date(willStart).getTime() >= new Date(willEnd).getTime()) {
    throw new Error("Maintenance end date must be after start date.");
  }
  await grpcRequest(() =>
    maintenanceClient.create(
      create(MaintenanceCreateRequestSchema, {
        description,
        time: create(TimeRangeSchema, {
          start: timestampFromDate(new Date(willStart)),
          end: timestampFromDate(new Date(willEnd)),
        }),
      }),
    ),
  );
}

export type EditMaintenancePayload = {
  description?: string | null;
  scope?: MaintenanceScope | null;
};

export async function editMaintenance(
  payload: EditMaintenancePayload,
): Promise<void> {
  const description = payload.description?.trim();
  const scope = normalizeMaintenanceScope(payload.scope);
  if (!description && !scope) {
    throw new Error("At least one field is required.");
  }
  await apiRequest("/api/maintenance/edit", {
    method: "POST",
    body: JSON.stringify({
      ...(description ? { description } : {}),
      ...(scope ? { scope } : {}),
    }),
  });
}

export async function completeMaintenance(): Promise<void> {
  await apiRequest("/api/maintenance/complete", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchUserNotifications(options?: {
  shown?: boolean;
  signal?: AbortSignal;
}): Promise<ApiNotification[]> {
  const params = new URLSearchParams();
  if (typeof options?.shown === "boolean") {
    params.set("shown", String(options.shown));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  const payload = await apiRequest<unknown>(`/api/notifications/user${query}`, {
    method: "GET",
    signal: options?.signal,
  });
  return toNotifications(payload);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Notification id is required.");
  }
  await apiRequest(`/api/notifications/mark/${encodeURIComponent(trimmed)}`, {
    method: "POST",
    body: JSON.stringify({ id: trimmed }),
  });
}

export async function fetchStatisticsGlobal(options?: {
  signal?: AbortSignal;
}): Promise<StatisticsGlobal> {
  const payload = await grpcRequest(() =>
    statisticClient.global(create(EmptySchema, {}), {
      signal: options?.signal,
    }),
  );
  return toStatisticsGlobal(payload);
}

export async function fetchStatisticsProjectVotes(options?: {
  city?: string;
  separator?: Separator;
  signal?: AbortSignal;
}): Promise<StatisticsGraph> {
  const payload = await grpcRequest(() =>
    statisticClient.projectVotes(
      create(RequestByCitySchema, {
        city: options?.city?.trim() || "",
        separator: options?.separator ?? Separator.DAILY,
      }),
      { signal: options?.signal },
    ),
  );
  return toStatisticsGraph(payload);
}

export async function fetchStatisticsProjectCreation(options?: {
  city?: string;
  separator?: Separator;
  signal?: AbortSignal;
}): Promise<StatisticsGraph> {
  const payload = await grpcRequest(() =>
    statisticClient.projectCreation(
      create(RequestByCitySchema, {
        city: options?.city?.trim() || "",
        separator: options?.separator ?? Separator.DAILY,
      }),
      { signal: options?.signal },
    ),
  );
  return toStatisticsGraph(payload);
}

export async function fetchStatisticsProjectDiscussion(options?: {
  city?: string;
  separator?: Separator;
  signal?: AbortSignal;
}): Promise<StatisticsGraph> {
  const payload = await grpcRequest(() =>
    statisticClient.projectDiscussion(
      create(RequestByCitySchema, {
        city: options?.city?.trim() || "",
        separator: options?.separator ?? Separator.DAILY,
      }),
      { signal: options?.signal },
    ),
  );
  return toStatisticsGraph(payload);
}

export async function fetchStatisticsQuestionsActivity(options?: {
  separator?: Separator;
  signal?: AbortSignal;
}): Promise<StatisticsGraph> {
  const payload = await grpcRequest(() =>
    statisticClient.questionsActivity(
      create(SeparatorValueSchema, {
        value: options?.separator ?? Separator.DAILY,
      }),
      { signal: options?.signal },
    ),
  );
  return toStatisticsGraph(payload);
}

export async function approveSubmission(id: string | number): Promise<void> {
  const trimmed = String(id).trim();
  if (!trimmed) {
    throw new Error("Submission id is required.");
  }
  await grpcRequest(() =>
    projectsClient.acceptSubmission(
      create(RequestWithValueSchema, { value: trimmed }),
    ),
  );
}

export async function declineSubmission(
  id: string | number,
  reason: string,
): Promise<void> {
  const trimmed = reason.trim();
  if (!trimmed) {
    throw new Error("Decline reason is required.");
  }
  const submissionId = String(id).trim();
  if (!submissionId) {
    throw new Error("Submission id is required.");
  }
  await grpcRequest(() =>
    projectsClient.denySubmission(
      create(RequestWithValuesSchema, { values: [submissionId, trimmed] }),
    ),
  );
}

export async function toggleProjectLike(projectID: string): Promise<void> {
  const trimmed = projectID.trim();
  if (!trimmed) {
    throw new Error("Project id is required.");
  }
  await grpcRequest(() =>
    projectsClient.processLikes(
      create(RequestWithValuesSchema, { values: [trimmed, "true"] }),
    ),
  );
}

export async function voteForProject(projectID: string): Promise<void> {
  await toggleProjectLike(projectID);
}

type TicketCreateResult = {
  id: string;
  token?: string;
};

export async function createTicket(
  payload: CreateTicketPayload,
): Promise<TicketCreateResult> {
  const topic = payload.topic.trim();
  const brief = payload.brief.trim();
  const content = payload.content.trim();
  if (!topic) {
    throw new Error("Ticket topic is required.");
  }
  if (!brief) {
    throw new Error("Ticket brief is required.");
  }
  if (!content) {
    throw new Error("Ticket content is required");
  }
  const response = await grpcRequest(() =>
    ticketClient.createTicket(
      create(CreateTicketRequestSchema, {
        topic,
        title: brief,
        message: content,
      }),
    ),
  );
  const id = response.id.trim();
  if (!id) {
    throw new Error("Ticket id is missing.");
  }
  return { id };
}

export async function uploadProjectPhotos(
  projectId: string,
  files: File[],
): Promise<ApiAvatar[]> {
  const trimmedId = projectId.trim();
  if (!trimmedId) {
    throw new Error("Project id is required.");
  }
  const images = files.filter((file) => file.type.startsWith("image/"));
  if (images.length === 0) {
    return [];
  }

  const uploads = images.map(async (file) => {
    const contentType = file.type || "application/octet-stream";
    let response: Awaited<ReturnType<typeof storageClient.getUploadURL>>;
    try {
      response = await grpcRequest(() =>
        storageClient.getUploadURL(
          create(GetUploadURLRequestSchema, {
            contentType,
            purpose: StoragePurpose.PROJECT_IMAGE,
          }),
        ),
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === StatusCodes.SERVICE_UNAVAILABLE
      ) {
        return null;
      }
      throw error;
    }
    const presignUrl = response.url?.trim();
    if (!presignUrl) {
      return null;
    }
    const uploadResponse = await fetch(presignUrl, {
      method: "PUT",
      body: file,
      credentials: "omit",
      headers: contentType ? { "Content-Type": contentType } : undefined,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Photo upload failed (${uploadResponse.status}).`);
    }
    return { key: response.fileId, contentType };
  });

  const results = await Promise.all(uploads);
  return results.filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function fetchStoragePresignGet(
  key: string,
  options?: { signal?: AbortSignal },
): Promise<string> {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    return "";
  }
  const payload = await apiRequest<
    | PresignResponse
    | {
      url?: string;
      data?: { presign?: string; url?: string } | null;
    }
  >(`/api/storage/presign/get?key=${encodeURIComponent(trimmedKey)}`, {
    method: "GET",
    signal: options?.signal,
  });
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const response = payload as {
    presign?: string;
    url?: string;
    data?: { presign?: string; url?: string } | null;
  };
  return (
    (typeof response.presign === "string" ? response.presign.trim() : "") ||
    (typeof response.url === "string" ? response.url.trim() : "") ||
    (typeof response.data?.presign === "string"
      ? response.data.presign.trim()
      : "") ||
    (typeof response.data?.url === "string" ? response.data.url.trim() : "")
  );
}

export async function fetchTicketInfo(
  id: string,
  options?: { signal?: AbortSignal; token?: string },
): Promise<ApiTicket | null> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Ticket id is required.");
  }
  const payload = await grpcRequest(() =>
    ticketClient.info(create(RequestWithValueSchema, { value: trimmed }), {
      signal: options?.signal,
    }),
  );
  return toApiTicket(payload);
}

export async function fetchTicketMessages(
  id: string,
  options?: {
    signal?: AbortSignal;
    token?: string;
    includeDeleted?: boolean;
  },
): Promise<ApiTicketMessage[]> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Ticket id is required.");
  }
  const payload = await grpcRequest(() =>
    ticketClient.messages(
      create(RequestWithLimitAndOffsetAndValueSchema, {
        limit: 500,
        offset: 0,
        value: trimmed,
      }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map(toApiTicketMessage);
}

export async function fetchProjectDiscussionMessages(
  projectID: string,
  options?: {
    signal?: AbortSignal;
    includeDeleted?: boolean;
  },
): Promise<ApiTicketMessage[]> {
  const trimmedID = projectID.trim();
  if (!trimmedID) {
    throw new Error("Project id is required.");
  }

  const payload = await grpcRequest(() =>
    projectsClient.messagesList(
      create(RequestWithLimitAndOffsetAndValueSchema, {
        limit: 500,
        offset: 0,
        value: trimmedID,
      }),
      {
        signal: options?.signal,
      },
    ),
  );
  return payload.list.map(toApiProjectMessage);
}

export async function createProjectDiscussionMessage(
  projectID: string,
  message: string,
  options?: { replyToId?: string | number | null },
): Promise<void> {
  const trimmedProjectID = projectID.trim();
  if (!trimmedProjectID) {
    throw new Error("Project id is required.");
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error("Project message is required.");
  }

  const replyRaw = options?.replyToId;
  const replyToId =
    typeof replyRaw === "number" && Number.isFinite(replyRaw)
      ? Math.trunc(replyRaw)
      : typeof replyRaw === "string" && replyRaw.trim()
        ? Number.parseInt(replyRaw.trim(), 10)
        : undefined;
  if (
    typeof replyToId === "number" &&
    (!Number.isFinite(replyToId) || replyToId <= 0)
  ) {
    throw new Error("Reply message id is invalid.");
  }

  await grpcRequest(() =>
    projectsClient.createMessage(
      create(ProjectCreateMessageRequestSchema, {
        project: trimmedProjectID,
        parent: typeof replyToId === "number" ? String(replyToId) : "",
        content: trimmedMessage,
      }),
    ),
  );
}

export async function updateTicketMessage(
  id: string,
  messageId: string,
  message: string,
  options?: { token?: string },
): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Ticket message is required.");
  }
  const encodedTicket = encodeURIComponent(id);
  const encodedMessage = encodeURIComponent(messageId);
  const body: Record<string, unknown> = { content: trimmed };
  if (options?.token) {
    body.token = options.token;
  }
  await apiRequest(`/api/tickets/${encodedTicket}/messages/${encodedMessage}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteTicketMessage(
  id: string,
  messageId: string,
  options?: { token?: string },
): Promise<void> {
  const encodedTicket = encodeURIComponent(id);
  const encodedMessage = encodeURIComponent(messageId);
  const body = options?.token
    ? JSON.stringify({ token: options.token })
    : undefined;
  const query = options?.token
    ? `?token=${encodeURIComponent(options.token)}`
    : "";
  await apiRequest(
    `/api/tickets/${encodedTicket}/messages/${encodedMessage}${query}`,
    {
      method: "DELETE",
      body,
    },
  );
}

export async function createTicketMessage(
  id: string,
  message: string,
  options?: { token?: string },
): Promise<void> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Ticket message is required.");
  }
  const ticketId = id.trim();
  if (!ticketId) {
    throw new Error("Ticket id is required.");
  }
  await grpcRequest(() =>
    ticketClient.createMessage(
      create(RequestWithValuesSchema, { values: [ticketId, trimmed] }),
    ),
  );
}

export async function closeTicket(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Ticket id is required.");
  }
  await grpcRequest(() =>
    ticketClient.close(
      create(RequestWithValuesSchema, { values: [trimmed, "closed"] }),
    ),
  );
}

export async function acceptTicket(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Ticket id is required.");
  }
  await grpcRequest(() =>
    ticketClient.accept(create(RequestWithValueSchema, { value: trimmed })),
  );
}

export async function fetchTicketsALL(options?: {
  signal?: AbortSignal;
}): Promise<ApiTicket[]> {
  const payload = await grpcRequest(() =>
    ticketClient.ticketsList(
      create(RequestWithLimitAndOffsetSchema, { limit: 500, offset: 0 }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map(toApiTicket);
}

export async function fetchTicketsSelf(options?: {
  signal?: AbortSignal;
}): Promise<ApiTicket[]> {
  const payload = await grpcRequest(() =>
    ticketClient.selfTickets(
      create(RequestWithLimitAndOffsetSchema, { limit: 500, offset: 0 }),
      { signal: options?.signal },
    ),
  );
  return payload.list.map(toApiTicket);
}

export async function fetchCities(options?: {
  signal?: AbortSignal;
}): Promise<{ id: string; name: string }[]> {
  const payload = await grpcRequest(() =>
    citiesClient.list(create(EmptySchema, {}), { signal: options?.signal }),
  );
  return payload.list.map((c) => ({ id: c.id, name: c.name }));
}

