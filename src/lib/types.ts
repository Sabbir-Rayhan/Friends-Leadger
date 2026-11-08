export type LoanStatus = "pending" | "confirmed" | "rejected" | "cancelled";
export type RepaymentStatus = "pending" | "confirmed" | "rejected";

export type LoanView = {
  id: string;
  lenderId: string;
  borrowerId: string;
  lenderName: string;
  borrowerName: string;
  amount: string;
  note: string | null;
  loanDate: string;
  status: LoanStatus;
};

export type RepaymentView = {
  id: string;
  loanId: string;
  amount: string;
  paidDate: string;
  note: string | null;
  status: RepaymentStatus;
};

export type ActionState = { error?: string; ok?: boolean };
