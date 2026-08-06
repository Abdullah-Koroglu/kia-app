export type Person = {
  id: string;
  extSourceId: number;
  name: string;
  nameDescription: string | null;
  birthYearHijri: number | null;
  birthYearGregorian: number | null;
  deathYearHijri: number | null;
  deathYearGregorian: number | null;
  detailNote: string | null;
  homelandId?: string | null;
  homelandName?: string | null;
  capabilities?: {
    canEdit: boolean;
    canDelete: boolean;
    canChangeExternalId: boolean;
  };
};

export type DictionaryItem = {
  id: number;
  name: string;
  description?: string | null;
};

export type Dictionaries = {
  methods: DictionaryItem[];
  scopes: DictionaryItem[];
  certainties: DictionaryItem[];
  places: DictionaryItem[];
};

export type RelationView = {
  id: string;
  teacherId: string;
  studentId: string;
  methodId: number;
  scopeId: number;
  certaintyId: number;
  placeId: number | null;
  detailNote: string | null;
  methodName: string;
  scopeName: string;
  certaintyName: string;
  placeName: string | null;
  counterpartId: string;
  counterpartExtSourceId: number;
  counterpartName: string;
  counterpartDescription: string | null;
};

export type PersonPageResult = {
  items: Person[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  capabilities: {
    canCreate: boolean;
    writableRanges: { startExtSourceId: number; endExtSourceId: number }[];
  };
};

export type RoleSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissionIds: string[];
};

export type PermissionSummary = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: Pick<RoleSummary, "id" | "code" | "name">[];
};

export type AssignmentScope = {
  id?: string;
  startExtSourceId: number;
  endExtSourceId: number;
};

export type ResearchAssignment = {
  id: string;
  researcherUserId: string;
  researcherName: string;
  title: string;
  description: string | null;
  startsAt: string;
  deadlineAt: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  isOverdue: boolean;
  scopes: AssignmentScope[];
  assignedCount: number;
  createdCount: number;
  missingIds: number[];
};
