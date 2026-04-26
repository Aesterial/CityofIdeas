import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { GRPC_BASE_URL } from "@/lib/api-base";
import { LoginService } from "@/gen/xyz/city_ideas/v1/login/v1/service_pb";
import { MaintenanceService } from "@/gen/xyz/city_ideas/v1/maintenances/v1/service_pb";
import { ProjectsService } from "@/gen/xyz/city_ideas/v1/projects/v1/service_pb";
import { RankService } from "@/gen/xyz/city_ideas/v1/ranks/v1/service_pb";
import { SessionService } from "@/gen/xyz/city_ideas/v1/sessions/v1/service_pb";
import { UserService } from "@/gen/xyz/city_ideas/v1/user/v1/service_pb";

const transport = createGrpcWebTransport({
  baseUrl: GRPC_BASE_URL,
  useBinaryFormat: true,
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
});

export const loginClient = createClient(LoginService, transport);
export const maintenanceClient = createClient(MaintenanceService, transport);
export const projectsClient = createClient(ProjectsService, transport);
export const rankClient = createClient(RankService, transport);
export const sessionClient = createClient(SessionService, transport);
export const userClient = createClient(UserService, transport);
