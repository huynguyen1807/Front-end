import { apiClient } from "../../../services/apiClient";
import {
  AddMemberPayload,
  CreateHouseholdPayload,
  Household,
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
