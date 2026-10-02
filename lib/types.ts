export type CalendarEventDTO = {
  id: string;
  title: string;
  type: string;
  date: string;
  clientId: string | null;
  client: { id: string; name: string } | null;
  notes: string | null;
};

export type TransactionDTO = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: string;
};

export type ColdCallDTO = {
  id: string;
  clientId: string | null;
  client: { id: string; name: string } | null;
  prospectName: string;
  date: string;
  outcome: string;
  notes: string | null;
  followUpDate: string | null;
};

export type ClientDTO = {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  dealValue: number;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};
