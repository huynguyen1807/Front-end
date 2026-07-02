export type HouseholdRole = "OWNER" | "MEMBER";

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

export interface HouseholdInvitationUser {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface HouseholdInvitation {
  _id: string;
  householdId: Household | string;
  invitedBy: HouseholdInvitationUser | string;
  inviteEmail: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
}

export interface CreateHouseholdPayload {
  householdName: string;
}

export interface AddMemberPayload {
  email?: string;
  userId?: string;
  permission?: Partial<MemberPermission>;
}

export interface UpdateMemberPayload {
  permission?: Partial<MemberPermission>;
}
