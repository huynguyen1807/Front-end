export type HouseholdRole = "OWNER" | "ADMIN" | "MEMBER";

export interface MemberPermission {
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewShoppingList: boolean;
  canEditShoppingList: boolean;
  canInviteMember: boolean;
}

export interface Household {
  _id: string;
  householdName: string;
  ownerId: string;
  planType: "FREE" | "PREMIUM";
  status: "ACTIVE" | "INACTIVE";
}

export interface MyHousehold {
  membershipId: string;
  role: HouseholdRole;
  permission: MemberPermission;
  joinedAt: string;
  household: Household;
}

export interface HouseholdMemberUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
}

export interface HouseholdMember {
  _id: string;
  householdId: string;
  userId: HouseholdMemberUser | string;
  role: HouseholdRole;
  permission: MemberPermission;
  status: "ACTIVE" | "REMOVED";
  joinedAt: string;
}

export interface CreateHouseholdPayload {
  householdName: string;
}

export interface AddMemberPayload {
  email?: string;
  userId?: string;
  role?: Exclude<HouseholdRole, "OWNER">;
  permission?: Partial<MemberPermission>;
}

export interface UpdateMemberPayload {
  role?: Exclude<HouseholdRole, "OWNER">;
  permission?: Partial<MemberPermission>;
}
