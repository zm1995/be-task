export class TransactionDto {
  userId: number;
  amount: number;
  endingBalance: number;
}

export class IssueTransactionsDto {
  transactions: TransactionDto[];
  option: boolean;
}
