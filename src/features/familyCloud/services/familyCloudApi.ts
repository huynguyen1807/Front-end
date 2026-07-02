import { apiClient } from "../../../services/apiClient";
import {
  AddMemberPayload,
  CreateHouseholdPayload,
  Household,
  HouseholdInvitation,
  HouseholdMember,
  MyHousehold,
  UpdateMemberPayload,
} from "../types/familyCloud";

export const createHouseholdApi = async (
  data: CreateHouseholdPayload
): Promise<Household> => {
  const res = await apiClient.post("/api/households", data);
  return res.data.data;
};

export const getMyHouseholdsApi = async (): Promise<MyHousehold[]> => {
  const res = await apiClient.get("/api/households/me");
  return res.data.data;
};

export const deleteHouseholdApi = async (householdId: string) => {
  const res = await apiClient.delete(`/api/households/${householdId}`);
  return res.data;
};

export const getHouseholdMembersApi = async (
  householdId: string
): Promise<HouseholdMember[]> => {
  const res = await apiClient.get(`/api/households/${householdId}/members`);
  return res.data.data;
};

export const addHouseholdMemberApi = async (
  householdId: string,
  data: AddMemberPayload
) => {
  const res = await apiClient.post(`/api/households/${householdId}/members`, data);
  return res.data.data;
};

export const getHouseholdInvitationsApi = async (
  householdId: string
): Promise<HouseholdInvitation[]> => {
  const res = await apiClient.get(`/api/households/${householdId}/invitations`);
  return res.data.data;
};

export const getMyHouseholdInvitationsApi = async (): Promise<HouseholdInvitation[]> => {
  const res = await apiClient.get("/api/households/invitations/me");
  return res.data.data;
};

export const acceptHouseholdInvitationApi = async (
  invitationId: string
): Promise<HouseholdMember> => {
  const res = await apiClient.post(`/api/households/invitations/${invitationId}/accept`);
  return res.data.data;
};

export const rejectHouseholdInvitationApi = async (invitationId: string) => {
  const res = await apiClient.post(`/api/households/invitations/${invitationId}/reject`);
  return res.data;
};

export const cancelHouseholdInvitationApi = async (
  householdId: string,
  invitationId: string
) => {
  const res = await apiClient.delete(
    `/api/households/${householdId}/invitations/${invitationId}`
  );
  return res.data;
};

export const updateHouseholdMemberApi = async (
  householdId: string,
  memberId: string,
  data: UpdateMemberPayload
): Promise<HouseholdMember> => {
  const res = await apiClient.patch(
    `/api/households/${householdId}/members/${memberId}`,
    data
  );
  return res.data.data;
};

export const removeHouseholdMemberApi = async (
  householdId: string,
  memberId: string
) => {
  const res = await apiClient.delete(`/api/households/${householdId}/members/${memberId}`);
  return res.data;
};
