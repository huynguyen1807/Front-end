import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  addHouseholdMemberApi,
  createHouseholdApi,
  getHouseholdMembersApi,
  getMyHouseholdsApi,
  removeHouseholdMemberApi,
  updateHouseholdMemberApi,
} from "../services/familyCloudApi";
import {
  AddMemberPayload,
  CreateHouseholdPayload,
  Household,
  HouseholdMember,
  MyHousehold,
  UpdateMemberPayload,
} from "../types/familyCloud";

export const fetchMyHouseholds = createAsyncThunk(
  "familyCloud/fetchMyHouseholds",
  async () => getMyHouseholdsApi()
);

export const fetchHouseholdMembers = createAsyncThunk(
  "familyCloud/fetchHouseholdMembers",
  async (householdId: string) => ({
    householdId,
    members: await getHouseholdMembersApi(householdId),
  })
);

export const createFamilyHousehold = createAsyncThunk(
  "familyCloud/createHousehold",
  async (payload: CreateHouseholdPayload) => createHouseholdApi(payload)
);

export const addFamilyMember = createAsyncThunk(
  "familyCloud/addMember",
  async ({ householdId, payload }: { householdId: string; payload: AddMemberPayload }) => ({
    householdId,
    result: await addHouseholdMemberApi(householdId, payload),
  })
);

export const updateFamilyMember = createAsyncThunk(
  "familyCloud/updateMember",
  async ({
    householdId,
    memberId,
    payload,
  }: {
    householdId: string;
    memberId: string;
    payload: UpdateMemberPayload;
  }) => updateHouseholdMemberApi(householdId, memberId, payload)
);

export const removeFamilyMember = createAsyncThunk(
  "familyCloud/removeMember",
  async ({ householdId, memberId }: { householdId: string; memberId: string }) => {
    await removeHouseholdMemberApi(householdId, memberId);
    return memberId;
  }
);

type FamilyCloudState = {
  households: MyHousehold[];
  selectedHouseholdId: string;
  members: HouseholdMember[];
  loading: boolean;
  membersLoading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: FamilyCloudState = {
  households: [],
  selectedHouseholdId: "",
  members: [],
  loading: false,
  membersLoading: false,
  saving: false,
  error: null,
};

const familyCloudSlice = createSlice({
  name: "familyCloud",
  initialState,
  reducers: {
    setSelectedHouseholdId: (state, action: PayloadAction<string>) => {
      state.selectedHouseholdId = action.payload;
    },
    clearFamilyCloudError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyHouseholds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyHouseholds.fulfilled, (state, action) => {
        state.loading = false;
        state.households = action.payload;

        const selectedExists = action.payload.some(
          (item) => item.household._id === state.selectedHouseholdId
        );
        if (!selectedExists) {
          state.selectedHouseholdId = action.payload[0]?.household._id ?? "";
        }
      })
      .addCase(fetchMyHouseholds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load households";
      })
      .addCase(fetchHouseholdMembers.pending, (state) => {
        state.membersLoading = true;
        state.error = null;
      })
      .addCase(fetchHouseholdMembers.fulfilled, (state, action) => {
        state.membersLoading = false;
        if (state.selectedHouseholdId === action.payload.householdId) {
          state.members = action.payload.members;
        }
      })
      .addCase(fetchHouseholdMembers.rejected, (state, action) => {
        state.membersLoading = false;
        state.error = action.error.message ?? "Failed to load members";
      })
      .addCase(createFamilyHousehold.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createFamilyHousehold.fulfilled, (state, action: PayloadAction<Household>) => {
        state.saving = false;
        state.selectedHouseholdId = action.payload._id;
      })
      .addCase(createFamilyHousehold.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to create household";
      })
      .addCase(addFamilyMember.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addFamilyMember.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addFamilyMember.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to add member";
      })
      .addCase(updateFamilyMember.fulfilled, (state, action) => {
        const index = state.members.findIndex((member) => member._id === action.payload._id);
        if (index !== -1) {
          state.members[index] = action.payload;
        }
      })
      .addCase(removeFamilyMember.fulfilled, (state, action) => {
        state.members = state.members.filter((member) => member._id !== action.payload);
      });
  },
});

export const { clearFamilyCloudError, setSelectedHouseholdId } = familyCloudSlice.actions;
export default familyCloudSlice.reducer;
