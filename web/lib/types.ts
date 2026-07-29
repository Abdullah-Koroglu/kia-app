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
};

