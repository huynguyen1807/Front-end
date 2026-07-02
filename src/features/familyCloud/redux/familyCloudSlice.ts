import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  acceptHouseholdInvitationApi,
  addHouseholdMemberApi,
  cancelHouseholdInvitationApi,
  createHouseholdApi,
  deleteHouseholdApi,
  getHouseholdInvitationsApi,
  getHouseholdMembersApi,
  getMyHouseholdsApi,
  getMyHouseholdInvitationsApi,
  removeHouseholdMemberApi,
  rejectHouseholdInvitationApi,
  updateHouseholdMemberApi,
} from "../services/familyCloudApi";
import {
  AddMemberPayload,
  CreateHouseholdPayload,
  Household,
  HouseholdInvitation,
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

export const fetchHouseholdInvitations = createAsyncThunk(
  "familyCloud/fetchHouseholdInvitations",
  async (householdId: string) => ({
    householdId,
    invitations: await getHouseholdInvitationsApi(householdId),
  })
);

export const fetchMyHouseholdInvitations = createAsyncThunk(
  "familyCloud/fetchMyHouseholdInvitations",
  async () => getMyHouseholdInvitationsApi()
);

export const createFamilyHousehold = createAsyncThunk(
  "familyCloud/createHousehold",
  async (payload: CreateHouseholdPayload) => createHouseholdApi(payload)
);

export const deleteFamilyHousehold = createAsyncThunk(
  "familyCloud/deleteHousehold",
  async (householdId: string) => {
    await deleteHouseholdApi(householdId);
    return householdId;
  }
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

export const acceptFamilyInvitation = createAsyncThunk(
  "familyCloud/acceptInvitation",
  async (invitationId: string) => {
    await acceptHouseholdInvitationApi(invitationId);
    return invitationId;
  }
);

export const rejectFamilyInvitation = createAsyncThunk(
  "familyCloud/rejectInvitation",
  async (invitationId: string) => {
    await rejectHouseholdInvitationApi(invitationId);
    return invitationId;
  }
);

export const cancelFamilyInvitation = createAsyncThunk(
  "familyCloud/cancelInvitation",
  async ({ householdId, invitationId }: { householdId: string; invitationId: string }) => {
    await cancelHouseholdInvitationApi(householdId, invitationId);
    return invitationId;
  }
);

type FamilyCloudState = {
  households: MyHousehold[];
  selectedHouseholdId: string;
  members: HouseholdMember[];
  invitations: HouseholdInvitation[];
  receivedInvitations: HouseholdInvitation[];
  loading: boolean;
  membersLoading: boolean;
  invitationsLoading: boolean;
  receivedInvitationsLoading: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: FamilyCloudState = {
  households: [],
  selectedHouseholdId: "",
  members: [],
  invitations: [],
  receivedInvitations: [],
  loading: false,
  membersLoading: false,
  invitationsLoading: false,
  receivedInvitationsLoading: false,
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

        if (!state.selectedHouseholdId) {
          state.members = [];
          state.invitations = [];
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
      .addCase(fetchHouseholdInvitations.pending, (state) => {
        state.invitationsLoading = true;
        state.error = null;
      })
      .addCase(fetchHouseholdInvitations.fulfilled, (state, action) => {
        state.invitationsLoading = false;
        if (state.selectedHouseholdId === action.payload.householdId) {
          state.invitations = action.payload.invitations;
        }
      })
      .addCase(fetchHouseholdInvitations.rejected, (state, action) => {
        state.invitationsLoading = false;
        state.error = action.error.message ?? "Failed to load invitations";
      })
      .addCase(fetchMyHouseholdInvitations.pending, (state) => {
        state.receivedInvitationsLoading = true;
        state.error = null;
      })
      .addCase(fetchMyHouseholdInvitations.fulfilled, (state, action) => {
        state.receivedInvitationsLoading = false;
        state.receivedInvitations = action.payload;
      })
      .addCase(fetchMyHouseholdInvitations.rejected, (state, action) => {
        state.receivedInvitationsLoading = false;
        state.error = action.error.message ?? "Failed to load your invitations";
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
      .addCase(deleteFamilyHousehold.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteFamilyHousehold.fulfilled, (state, action) => {
        state.saving = false;
        state.households = state.households.filter(
          (item) => item.household._id !== action.payload
        );
        state.members = [];
        state.invitations = [];
        state.selectedHouseholdId = state.households[0]?.household._id ?? "";
      })
      .addCase(deleteFamilyHousehold.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to delete household";
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
      })
      .addCase(acceptFamilyInvitation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(acceptFamilyInvitation.fulfilled, (state, action) => {
        state.saving = false;
        state.receivedInvitations = state.receivedInvitations.filter(
          (invitation) => invitation._id !== action.payload
        );
      })
      .addCase(acceptFamilyInvitation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to accept invitation";
      })
      .addCase(rejectFamilyInvitation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(rejectFamilyInvitation.fulfilled, (state, action) => {
        state.saving = false;
        state.receivedInvitations = state.receivedInvitations.filter(
          (invitation) => invitation._id !== action.payload
        );
      })
      .addCase(rejectFamilyInvitation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to reject invitation";
      })
      .addCase(cancelFamilyInvitation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(cancelFamilyInvitation.fulfilled, (state, action) => {
        state.saving = false;
        state.invitations = state.invitations.filter(
          (invitation) => invitation._id !== action.payload
        );
      })
      .addCase(cancelFamilyInvitation.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? "Failed to cancel invitation";
      });
  },
});

export const { clearFamilyCloudError, setSelectedHouseholdId } = familyCloudSlice.actions;
export default familyCloudSlice.reducer;
